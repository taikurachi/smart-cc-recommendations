import { chromium, Browser, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

interface ScrapedData {
  title: string;
  url: string;
  timestamp: string;
}

class NerdWalletScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true, // Set to true for headless mode to avoid issues
      slowMo: 500, // Slow down by 500ms
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Add args for better compatibility
    });

    this.page = await this.browser.newPage();

    // Set user agent to avoid detection
    await this.page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    // Set viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });

    // Listen to browser console logs
    this.page.on("console", (msg) => {
      console.log(`🌐 Browser Console [${msg.type()}]:`, msg.text());
    });
  }

  async scrapeCreditCardSection(): Promise<any> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    // Navigate to the specific excellent credit cards page
    await this.page.goto(
      "https://www.nerdwallet.com/m/credit-cards/excellent-credit-cards",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000, // 60 second timeout
      }
    );
    await this.page.waitForTimeout(3000);

    // Try to extract credit card information
    try {
      const pageTitle = await this.page.title();
      console.log(`Scraping page: ${pageTitle}`);

      // Extract credit card information from the table/list structure
      const creditCards = await this.page.evaluate(() => {
        const cards: any[] = [];
        const creditCardTable = document.querySelector("tbody");

        // Look for table rows or card containers
        if (!creditCardTable) return;

        // Each row represents each credit card
        const rows = creditCardTable.querySelectorAll("tr");

        rows.forEach((row, rowIndex) => {
          // Early validation: skip rows that don't have the expected number of columns
          const tableData = row.querySelectorAll("td");
          if (tableData.length < 5) return; // Skip rows without 5 columns

          // Early validation: check if this row has a card name in the first column
          const firstCol = tableData[0];
          const hasCardName = firstCol.querySelector(
            '[data-testid*="summary-table-card-name"]'
          );

          if (!hasCardName) return; // Skip rows without valid card names

          console.log(`Row ${rowIndex}: Processing card "${hasCardName}"`);
          const cardData = {};

          // Process each column for this validated row
          tableData.forEach((col, colIndex) => {
            // 0: card name, 1: rating, 2: annual fee, 3: rewards, 4: intro

            // extract card name
            if (colIndex === 0) {
              // Try specific selector first
              const nameElement = col.querySelector(
                '[data-testid*="summary-table-card-name"]'
              );
              const cardName = nameElement?.textContent?.trim();

              if (cardName && cardName !== "ref: <Node>") {
                cardData.name = cardName;
              }
            }

            // extract ratings
            if (colIndex === 1) {
              const rating = col.textContent.slice(0, 3);
              if (rating) cardData.rating = rating;
            }

            // extract annual fee
            if (colIndex === 2) {
              const annualFee = col.textContent;
              const normalizedFee = annualFee.slice(1);
              if (normalizedFee) cardData.annualFee = normalizedFee;
            }

            // extract rewards with tooltip handling
            if (colIndex === 3) {
              const basicRewards = col.textContent?.trim();
              if (basicRewards) cardData.rewards = basicRewards;

              // Check for tooltip button
              const tooltipButton = col.querySelector("button");
              if (tooltipButton) {
                cardData.hasRewardsTooltip = true;
              }
            }

            // extract intro/bonus offers
            if (colIndex === 4) {
              const introOfferText = col.textContent?.trim();

              if (introOfferText) {
                // Inline parsing logic to avoid function definition issues
                let parsedOffer = { amount: null, currency: null };

                // Handle N/A case
                if (/N\/?A/i.test(introOfferText)) {
                  parsedOffer = { amount: null, currency: null };
                }
                // Handle special cases like "Cashback Match"
                else if (/cashback\s*match/i.test(introOfferText)) {
                  parsedOffer = { amount: "match", currency: "cashback" };
                } else {
                  // Remove noise phrases
                  const cleaned = introOfferText
                    .replace(/find out your offer/gi, "")
                    .replace(/as high as/gi, "")
                    .replace(/cashback match™?/gi, "")
                    .trim();

                  // Extract dollar amounts
                  const dollarRegex = /\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g;
                  const dollarMatches = [];
                  let match;
                  while ((match = dollarRegex.exec(cleaned)) !== null) {
                    dollarMatches.push(parseFloat(match[1].replace(/,/g, "")));
                  }

                  // Extract points/miles
                  const pointsRegex =
                    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(miles|points)/gi;
                  const pointsMatches = [];
                  while ((match = pointsRegex.exec(cleaned)) !== null) {
                    pointsMatches.push({
                      amount: parseFloat(match[1].replace(/,/g, "")),
                      currency: match[2].toLowerCase(),
                    });
                  }

                  // Return results
                  if (dollarMatches.length > 0) {
                    const total = dollarMatches.reduce(
                      (sum, amt) => sum + amt,
                      0
                    );
                    parsedOffer = { amount: total, currency: "dollars" };
                  } else if (pointsMatches.length > 0) {
                    parsedOffer = {
                      amount: pointsMatches[0].amount,
                      currency: pointsMatches[0].currency,
                    };
                  }
                }

                cardData.introOffer = parsedOffer;
              }

              // Check for intro offer tooltip button
              const introTooltipButton = col.querySelector("button");
              if (introTooltipButton) {
                cardData.hasIntroTooltip = true;
              }
            }
          });

          // Try to extract card image
          const imageElement = row.querySelector("img");
          if (imageElement) {
            const imgSrc =
              imageElement.getAttribute("src") ||
              imageElement.getAttribute("data-src");
            const imgAlt = imageElement.getAttribute("alt");
            if (imgSrc) {
              cardData.image = {
                src: imgSrc,
                alt: imgAlt || "",
                // Create a clean filename from card name or index
                filename:
                  cardData.name && typeof cardData.name === "string"
                    ? `${cardData.name
                        .replace(/[^a-zA-Z0-9]/g, "_")
                        .toLowerCase()}.jpg`
                    : `card_${rowIndex + 1}.jpg`,
              };
            }
          }

          // Only add cards that have essential data: name AND (annualFee OR rewards)
          if (
            cardData.name &&
            (cardData.annualFee !== undefined || cardData.rewards)
          ) {
            cards.push(cardData);
          }
        });

        return cards;
      });

      // Extract detailed tooltip information for cards that have tooltips
      for (let i = 0; i < creditCards.length; i++) {
        const card = creditCards[i];

        // Extract rewards tooltip
        if (card.hasRewardsTooltip) {
          try {
            const tooltipContent = await this.extractRewardsTooltip(i);

            if (tooltipContent) {
              // Save both raw and parsed data
              creditCards[i].detailedRewards = {
                raw: tooltipContent,
                parsed: this.parseRewardsTooltip(tooltipContent),
              };
            }
          } catch (error) {
            console.log(
              `Failed to extract rewards tooltip for ${card.name}:`,
              error.message
            );
          }
        }

        // Extract intro offer tooltip
        if (card.hasIntroTooltip) {
          try {
            const introTooltipContent = await this.extractIntroTooltip(i);
            if (introTooltipContent) {
              // Save both raw and parsed data
              creditCards[i].detailedIntroOffer = {
                raw: introTooltipContent,
              };
            }
          } catch (error) {
            console.log(
              `Failed to extract intro tooltip for ${card.name}:`,
              error.message
            );
          }
        }
      }

      // Also get some general page info
      const headings = await this.page.$$eval("h1, h2, h3", (elements) =>
        elements
          .slice(0, 5)
          .map((el) => el.textContent?.trim())
          .filter((text) => text && text.length > 0)
      );

      return {
        pageTitle,
        url: this.page.url(),
        headings,
        creditCards,
        totalCardsFound: creditCards?.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error scraping credit card section:", error);
      return {
        error: "Failed to scrape credit card section",
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async extractRewardsTooltip(cardIndex: number): Promise<string | null> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    try {
      // Find the table and the specific row for this card
      const tableRow = await this.page.locator("tbody tr").nth(cardIndex);

      // Find the rewards column (assuming it's the 4th column, index 3)
      const rewardsCell = tableRow.locator("td").nth(3);

      // Look for button tooltip triggers in the rewards cell
      const trigger = rewardsCell.locator("button").first();
      let tooltipContent = null;

      if ((await trigger.count()) > 0) {
        try {
          // Click the button to trigger tooltip
          await trigger.click();
          await this.page.waitForTimeout(1000);

          // Look for tooltip content that appeared
          const tooltip = this.page.locator(".MuiTooltip-tooltip").first();
          if ((await tooltip.count()) > 0 && (await tooltip.isVisible())) {
            tooltipContent = await tooltip.textContent();
            // Close tooltip by pressing escape
            await this.page.keyboard.press("Escape");
          }
        } catch (error) {
          console.log(`Error clicking button trigger:`, error.message);
        }
      }

      // Method 3: Check for hidden elements or data attributes

      return tooltipContent;
    } catch (error) {
      console.error(`Error extracting tooltip for card ${cardIndex}:`, error);
      return null;
    }
  }

  async extractIntroTooltip(cardIndex: number): Promise<string | null> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    try {
      // Find the table and the specific row for this card
      const tableRow = await this.page.locator("tbody tr").nth(cardIndex);

      // Find the intro offer column (assuming it's the 5th column, index 4)
      const introCell = tableRow.locator("td").nth(4);

      // Look for button tooltip triggers in the intro cell
      const trigger = introCell.locator("button").first();
      let tooltipContent = null;

      if ((await trigger.count()) > 0) {
        try {
          // Click the button to trigger tooltip
          await trigger.click();
          await this.page.waitForTimeout(1000);

          // Look for tooltip content that appeared
          const tooltip = this.page.locator(".MuiTooltip-tooltip").first();
          if ((await tooltip.count()) > 0 && (await tooltip.isVisible())) {
            tooltipContent = await tooltip.textContent();
            // Close tooltip by pressing escape
            await this.page.keyboard.press("Escape");
          }
        } catch (error) {
          console.log(`Error clicking intro button trigger:`, error.message);
        }
      }

      return tooltipContent;
    } catch (error) {
      console.error(
        `Error extracting intro tooltip for card ${cardIndex}:`,
        error
      );
      return null;
    }
  }

  private parseRewardsTooltip(tooltipText: string): any {
    const rewards = {
      categories: [],
    };

    return rewards;
  }

  private normalizeCategory(rawCategory: string): {
    category: string;
    platform?: string;
  } {
    const category = rawCategory.toLowerCase();

    // Category mapping with platform detection
    const categoryMappings = {
      // Dining
      dining: "restaurants",
      restaurants: "restaurants",
      "dining at restaurants": "restaurants",
      restaurant: "restaurants",

      // Groceries
      "grocery stores": "groceries",
      groceries: "groceries",
      supermarkets: "groceries",
      "u.s. supermarkets": "groceries",

      // Gas
      "gas stations": "gas",
      gas: "gas",
      "u.s. gas stations": "gas",

      // Drugstore
      "drugstore purchases": "drugstore",
      drugstore: "drugstore",
      pharmacy: "drugstore",

      // Streaming
      "streaming services": "streaming",
      streaming: "streaming",
      "select streaming services": "streaming",
      "u.s. streaming subscriptions": "streaming",

      // Transit
      transit: "transit",
      transportation: "transit",
      "taxis/rideshare": "transit",
      parking: "transit",
      tolls: "transit",

      // General
      "all other purchases": "general",
      "other purchases": "general",
      "everything else": "general",
      "all purchases": "general",
    };

    // Handle travel separately due to platform complexity
    if (this.isTravelCategory(category)) {
      return this.extractTravelPlatform(category);
    }

    // Check for exact matches first
    for (const [key, value] of Object.entries(categoryMappings)) {
      if (category.includes(key)) {
        return { category: value };
      }
    }

    // If no match found, return cleaned version of original
    return {
      category: category
        .replace(/purchases?/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    };
  }

  private isTravelCategory(category: string): boolean {
    const travelKeywords = [
      "travel",
      "flight",
      "hotel",
      "rental car",
      "vacation rental",
    ];
    return travelKeywords.some((keyword) => category.includes(keyword));
  }

  private extractTravelPlatform(category: string): {
    category: string;
    platform?: string;
  } {
    // Platform-specific travel detection
    if (category.includes("chase travel")) {
      return { category: "travel", platform: "Chase Travel" };
    }
    if (category.includes("capital one travel")) {
      return { category: "travel", platform: "Capital One Travel" };
    }
    if (category.includes("american express travel")) {
      return { category: "travel", platform: "American Express Travel" };
    }
    if (category.includes("citi travel")) {
      return { category: "travel", platform: "Citi Travel" };
    }

    // Specific travel subcategories
    if (category.includes("hotel")) {
      return { category: "hotels" };
    }
    if (category.includes("flight")) {
      return { category: "flights" };
    }
    if (category.includes("rental car")) {
      return { category: "rental-cars" };
    }
    if (category.includes("vacation rental")) {
      return { category: "vacation-rentals" };
    }

    // Default travel
    return { category: "travel" };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log("Browser closed.");
    }
  }
}

// Example usage function
export async function runBasicScraper(): Promise<void> {
  const scraper = new NerdWalletScraper();

  try {
    await scraper.initialize();

    // Skip homepage and go directly to credit card section
    console.log("Skipping homepage, going directly to credit cards...");

    // Scrape credit card section
    const creditCardInfo = await scraper.scrapeCreditCardSection();
    console.log("Credit Card Info:", JSON.stringify(creditCardInfo, null, 2));

    // Take a screenshot
  } catch (error) {
    console.error("Scraping failed:", error);
  } finally {
    await scraper.close();
  }
}

// Export the scraper class for use in other files
export default NerdWalletScraper;

// If running this file directly
if (require.main === module) {
  runBasicScraper().catch(console.error);
}
