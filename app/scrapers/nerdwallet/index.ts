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

        console.log(`Found ${rows.length} total rows in table`);

        rows.forEach((row, rowIndex) => {
          // Early validation: skip rows that don't have the expected number of columns
          const tableData = row.querySelectorAll("td");
          if (tableData.length < 5) {
            console.log(
              `Row ${rowIndex}: Skipped - only ${tableData.length} columns`
            );
            return; // Skip rows without 5 columns
          }

          // Early validation: check if this row has a card name in the first column
          const firstCol = tableData[0];
          const hasCardName =
            firstCol.querySelector(
              '[data-testid*="summary-table-card-name"]'
            ) ||
            firstCol
              .querySelector("a, span, div, h3, h4, h5, h6")
              ?.textContent?.trim() ||
            firstCol.textContent?.trim();

          if (
            !hasCardName ||
            hasCardName === "ref: <Node>" ||
            hasCardName.length < 3
          ) {
            console.log(
              `Row ${rowIndex}: Skipped - no valid card name (found: "${hasCardName}")`
            );
            return; // Skip rows without valid card names
          }

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
              let cardName = nameElement?.textContent?.trim();

              // If that doesn't work, try other selectors
              if (!cardName) {
                const fallbackElement = col.querySelector(
                  "a, span, div, h3, h4, h5, h6"
                );
                cardName = fallbackElement?.textContent?.trim();
              }

              // If still no name, use column text content
              if (!cardName) {
                cardName = col.textContent?.trim();
              }

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
              const introOffer = col.textContent?.trim();
              if (introOffer) cardData.introOffer = introOffer;

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
      console.log("🔍 Extracting tooltip information...");
      for (let i = 0; i < creditCards.length; i++) {
        const card = creditCards[i];

        // Extract rewards tooltip
        if (card.hasRewardsTooltip) {
          console.log(`Extracting rewards tooltip for ${card.name}...`);

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
          console.log(`Extracting intro tooltip for ${card.name}...`);

          try {
            const introTooltipContent = await this.extractIntroTooltip(i);
            if (introTooltipContent) {
              // Save both raw and parsed data
              creditCards[i].detailedIntroOffer = {
                raw: introTooltipContent,
                parsed: this.parseIntroOffer(introTooltipContent),
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

      //   const imageDownloadResults: any[] = [];

      //   for (const card of creditCards) {
      //     if (card.image && card.image.src) {
      //       // Handle relative URLs
      //       let imageUrl = card.image.src;
      //       if (imageUrl.startsWith("//")) {
      //         imageUrl = "https:" + imageUrl;
      //       } else if (imageUrl.startsWith("/")) {
      //         imageUrl = "https://www.nerdwallet.com" + imageUrl;
      //       }

      //       const downloadSuccess = await this.downloadImage(
      //         imageUrl,
      //         card.image.filename
      //       );
      //       imageDownloadResults.push({
      //         cardName: card.name,
      //         imageUrl: imageUrl,
      //         filename: card.image.filename,
      //         downloaded: downloadSuccess,
      //       });
      //     }
      //   }

      // Remove duplicates based on card name, annual fee, and rewards
      const uniqueCards = creditCards.filter(
        (card, index, self) =>
          index ===
          self.findIndex(
            (c) =>
              c.name === card.name &&
              c.annualFee === card.annualFee &&
              c.rewards === card.rewards
          )
      );

      console.log(
        `🔄 Removed ${creditCards.length - uniqueCards.length} duplicate cards`
      );

      return {
        pageTitle,
        url: this.page.url(),
        headings,
        creditCards: uniqueCards,
        totalCardsFound: uniqueCards.length,
        // imageDownloadResults,
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

  async takeScreenshot(
    filename: string = "nerdwallet-screenshot.png"
  ): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`Screenshot saved as ${filename}`);
  }

  async downloadImage(imageUrl: string, filename: string): Promise<boolean> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    try {
      // Create images directory if it doesn't exist
      const imagesDir = path.join(process.cwd(), "scraped-images");
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const response = await this.page.request.get(imageUrl);
      if (response.ok()) {
        const buffer = await response.body();
        const filePath = path.join(imagesDir, filename);
        fs.writeFileSync(filePath, buffer);
        console.log(`Image saved: ${filePath}`);
        return true;
      } else {
        console.log(
          `Failed to download image: ${imageUrl} (Status: ${response.status()})`
        );
        return false;
      }
    } catch (error) {
      console.error(`Error downloading image ${imageUrl}:`, error);
      return false;
    }
  }

  async takeElementScreenshot(
    selector: string,
    filename: string
  ): Promise<boolean> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    try {
      const element = await this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        await element.screenshot({ path: filename });
        console.log(`Element screenshot saved: ${filename}`);
        return true;
      } else {
        console.log(`Element not found for screenshot: ${selector}`);
        return false;
      }
    } catch (error) {
      console.error(`Error taking element screenshot:`, error);
      return false;
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
        console.log(`Found tooltip trigger: button`);

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
        console.log(`Found intro tooltip trigger: button`);

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

    // Enhanced patterns for rewards extraction
    const patterns = [
      // Standard patterns
      /(\d+(?:\.\d+)?%)\s+cash\s+back\s+(?:at|on)\s+([^,\n.]+?)(?:\s+(?:on\s+up\s+to|up\s+to|\(then|\sand)|\.|,|$)/gi,
      /(\d+(?:\.\d+)?x)\s+(?:points?\s+)?on\s+([^,\n.]+?)(?:\s+(?:on\s+up\s+to|up\s+to|\(then|\sand)|\.|,|$)/gi,
      /(\d+(?:\.\d+)?)\s+(?:miles?\s+)?(?:per\s+\$1\s+)?on\s+([^,\n.]+?)(?:\s+(?:on\s+up\s+to|up\s+to|\(then|\sand)|\.|,|$)/gi,

      // Unlimited patterns
      /earn\s+unlimited\s+(\d+(?:\.\d+)?%)\s+cash\s+back\s+(?:at|on)\s+([^,\n.]+?)(?:\s+(?:on\s+up\s+to|up\s+to|\(then|\sand)|\.|,|$)/gi,
      /earn\s+unlimited\s+(\d+(?:\.\d+)?x)\s+(?:points?\s+)?on\s+([^,\n.]+?)(?:\s+(?:on\s+up\s+to|up\s+to|\(then|\sand)|\.|,|$)/gi,
      /earn\s+unlimited\s+(\d+(?:\.\d+)?)\s+(?:miles?\s+)?on\s+([^,\n.]+?)(?:\s+(?:on\s+up\s+to|up\s+to|\(then|\sand)|\.|,|$)/gi,

      // Special patterns for complex structures
      /(\d+(?:\.\d+)?%)\s+cash\s+back\s+at\s+([^,\n.]+?)\s+on\s+up\s+to/gi,
      /(\d+(?:\.\d+)?x)\s+(?:miles?\s+)?on\s+([^,\n.]+?)\s+booked\s+through/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(tooltipText)) !== null) {
        const rate = match[1];
        const rawCategory = match[2].trim();
        const normalizedCategory = this.normalizeCategory(rawCategory);

        rewards.categories.push({
          rate: rate,
          category: normalizedCategory.category,
          platform: normalizedCategory.platform,
          rawCategory: rawCategory,
        });
      }
    }

    return rewards;
  }

  private parseIntroOffer(tooltipText: string): any {
    const introOffer = {
      bonusAmount: null,
      spendRequirement: null,
      timeLimit: null,
      aprInfo: null,
      additionalBenefits: [],
    };

    // Extract bonus amount patterns
    const bonusPatterns = [
      /\$(\d+(?:,\d+)*)\s+(?:cash\s+back|bonus)/gi,
      /(\d+(?:,\d+)*)\s+(?:points?|miles?)\s+bonus/gi,
      /earn\s+(?:up\s+to\s+)?(\d+(?:,\d+)*)\s+(?:points?|miles?)/gi,
      /(\d+(?:,\d+)*)\s+(?:points?|miles?)/gi,
    ];

    for (const pattern of bonusPatterns) {
      const match = pattern.exec(tooltipText);
      if (match) {
        introOffer.bonusAmount = match[1];
        break;
      }
    }

    // Extract spend requirement
    const spendPatterns = [
      /spend\s+\$(\d+(?:,\d+)*)/gi,
      /after\s+you\s+spend\s+\$(\d+(?:,\d+)*)/gi,
      /\$(\d+(?:,\d+)*)\s+in\s+purchases/gi,
    ];

    for (const pattern of spendPatterns) {
      const match = pattern.exec(tooltipText);
      if (match) {
        introOffer.spendRequirement = match[1];
        break;
      }
    }

    // Extract time limit
    const timePatterns = [
      /within\s+(\d+)\s+months?/gi,
      /in\s+the\s+first\s+(\d+)\s+months?/gi,
      /(\d+)\s+months?\s+from\s+account\s+opening/gi,
    ];

    for (const pattern of timePatterns) {
      const match = pattern.exec(tooltipText);
      if (match) {
        introOffer.timeLimit = `${match[1]} months`;
        break;
      }
    }

    // Extract APR information
    const aprPatterns = [
      /(\d+(?:\.\d+)?%)\s+(?:intro\s+)?apr/gi,
      /0%\s+(?:intro\s+)?apr/gi,
      /(\d+)\s+months?\s+(?:of\s+)?0%\s+apr/gi,
    ];

    for (const pattern of aprPatterns) {
      const match = pattern.exec(tooltipText);
      if (match) {
        introOffer.aprInfo = match[0];
        break;
      }
    }

    // Extract additional benefits
    const benefitKeywords = [
      "no annual fee",
      "no foreign transaction fees",
      "free",
      "credit",
      "statement credit",
    ];
    for (const keyword of benefitKeywords) {
      if (tooltipText.toLowerCase().includes(keyword)) {
        introOffer.additionalBenefits.push(keyword);
      }
    }

    return introOffer;
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
    await scraper.takeScreenshot("nerdwallet-excellent-credit-cards.png");
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
