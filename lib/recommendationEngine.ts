import { loadCreditCardData } from "./creditCardData";
import { Transaction } from "./types";

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
}

/**
 * Map Plaid transaction categories to credit card reward categories
 */
function mapTransactionCategoryToRewardCategory(
  transactionCategory: string[]
): string[] {
  if (!transactionCategory || transactionCategory.length === 0) {
    return ["general"];
  }

  const primary = transactionCategory[0]?.toLowerCase() || "";
  const secondary = transactionCategory[1]?.toLowerCase() || "";

  // Food and Drink
  if (primary === "food and drink") {
    if (secondary === "restaurants" || secondary === "dining") {
      return ["dining"];
    }
    if (secondary === "groceries" || secondary === "grocery stores") {
      return ["grocery"];
    }
    return ["general"];
  }

  // Travel
  if (primary === "travel") {
    if (secondary === "airlines" || secondary === "flights") {
      return ["travel"];
    }
    if (secondary === "hotels") {
      return ["hotels"];
    }
    return ["travel"];
  }

  // General Merchandise
  if (primary === "general merchandise") {
    if (secondary === "online" || secondary === "online shopping") {
      return ["online-shopping"];
    }
    if (secondary === "drugstores") {
      return ["drugstores"];
    }
    return ["general"];
  }

  // Gas Stations
  if (primary === "gas stations" || primary === "gas") {
    return ["gas"];
  }

  // Entertainment
  if (primary === "entertainment") {
    return ["entertainment"];
  }

  // Default to general
  return ["general"];
}

/**
 * Calculate estimated annual rewards for a credit card based on transactions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateEstimatedRewards(
  card: any,
  transactions: any[]
): number {
  let totalRewards = 0;
  const categorySpending: Record<string, number> = {};

  // Get all reward categories that the card offers (rewards is now a map/object)
  const cardRewardCategories = new Set(
    card.rewards ? Object.keys(card.rewards) : []
  );

  const hasGeneralCategory = cardRewardCategories.has("general");

  // First, aggregate spending by reward category
  console.log(`\nProcessing ${transactions.length} transactions...`);
  transactions.forEach((transaction, index) => {
    // Only process spending transactions (positive amounts in our test data)
    if (transaction.amount <= 0) return;

    const amount = Math.abs(transaction.amount);
    const rewardCategories = mapTransactionCategoryToRewardCategory(
      transaction.category || []
    );
    console.log(rewardCategories, "reward cat");
    console.log(
      `  Transaction ${index + 1}: $${amount} | Categories: ${JSON.stringify(
        transaction.category
      )} → Reward Categories: ${JSON.stringify(rewardCategories)}`
    );

    // Check if any of the mapped categories exist on this card (excluding "general")
    const matchedCategories = rewardCategories.filter(
      (cat) => cat !== "general" && cardRewardCategories.has(cat)
    );

    if (matchedCategories.length > 0) {
      // Transaction matches specific categories - add to those categories
      matchedCategories.forEach((rewardCategory) => {
        categorySpending[rewardCategory] =
          (categorySpending[rewardCategory] || 0) + amount;
      });
    } else {
      // Transaction doesn't match any specific category - default to "general"
      if (hasGeneralCategory) {
        categorySpending["general"] =
          (categorySpending["general"] || 0) + amount;
        console.log(`    → No match found, defaulting to "general" category`);
      } else {
        console.log(
          `    → No match found, but card has no "general" category (spending not counted)`
        );
      }
    }
  });

  console.log(`\n=== Card: ${card.name} ===`);
  console.log("Category spending:", JSON.stringify(categorySpending, null, 2));
  console.log("Card rewards:", JSON.stringify(card.rewards, null, 2));

  // Calculate rewards for each card reward category (rewards is now a map/object)
  if (card.rewards) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(card.rewards).forEach(
      ([category, reward]: [string, any]) => {
        const spending = categorySpending[category] || 0;
        if (spending === 0) {
          console.log(`  No spending for category: ${category}`);
          return;
        }

        // Apply caps if they exist
        let cappedSpending = spending;
        if (reward.cap) {
          if (reward.cap.quarterly) {
            // Quarterly cap, so annual cap is 4x
            const annualCap = reward.cap.quarterly * 4;
            cappedSpending = Math.min(spending, annualCap);
            console.log(
              `  Category ${category}: Spending $${spending}, capped to $${cappedSpending} (annual cap: $${annualCap})`
            );
          } else if (reward.cap.annual) {
            cappedSpending = Math.min(spending, reward.cap.annual);
            console.log(
              `  Category ${category}: Spending $${spending}, capped to $${cappedSpending} (annual cap: $${reward.cap.annual})`
            );
          }
        } else {
          console.log(`  Category ${category}: Spending $${spending} (no cap)`);
        }

        // Calculate reward amount
        let rewardAmount: number;

        if (reward.unit === "points") {
          // For points: rate represents the multiplier (e.g., 0.05 = 5X points = 5 points per dollar)
          // Convert rate to points per dollar: 0.05 × 100 = 5 points per dollar
          // Then calculate: spending × points per dollar × $0.01 per point = cash value
          const pointsPerDollar = reward.rate * 100; // 0.05 → 5 points per dollar (5X)
          const pointsEarned = cappedSpending * pointsPerDollar; // $450 × 5 = 2,250 points
          rewardAmount = pointsEarned * 0.01; // 2,250 points × $0.01 = $22.50 cash

          console.log(
            `  Reward calculation: $${cappedSpending} × ${pointsPerDollar.toFixed(
              0
            )}X points = ${pointsEarned.toFixed(
              0
            )} points → $${rewardAmount.toFixed(2)} cash`
          );
        } else {
          // For cash: rate is cash back percentage (e.g., 0.03 = 3% cash back)
          rewardAmount = cappedSpending * reward.rate;
          console.log(
            `  Reward calculation: $${cappedSpending} × ${reward.rate} (${(
              reward.rate * 100
            ).toFixed(0)}%) = $${rewardAmount.toFixed(2)} cash`
          );
        }

        totalRewards += rewardAmount;
      }
    );
  }

  console.log(`Total estimated rewards: $${totalRewards.toFixed(2)}\n`);
  return totalRewards;
}

/**
 * Get recommended credit cards based on transactions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRecommendedCards(
  transactions: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preferences: any
) {
  const creditCards = await loadCreditCardData();
  let message;
  // filter out credit cards based preferences, return at most 3 cards
  const preferencesArr = Object.entries(preferences)
    .filter(([, value]) => value)
    .map(([key]) => key);

  // tags: ['groceries, travel, no_annual_fee']
  let preferredCreditCards = creditCards.filter((card) => {
    const tags = card.tags || [];
    // Check if card has all of the user's selected preferences
    return preferencesArr.every((pref) => tags.includes(pref));
  });

  if (preferredCreditCards.length === 0) {
    preferredCreditCards = creditCards.filter((card) => {
      const tags = card.tags || [];
      // Check if card has any of the user's selected preferences
      return preferencesArr.some((pref) => tags.includes(pref));
    });
  }

  if (preferredCreditCards.length === 0)
    message = "There were no matches. Recommending you best value cards.";
  // If no matches, return all cards
  const cardsToProcess =
    preferredCreditCards.length === 0 ? creditCards : preferredCreditCards;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recommendedCards = cardsToProcess.map((card: any) => {
    const estimatedRewards = calculateEstimatedRewards(card, transactions);

    // Calculate total annual value (rewards + credits + benefits - annual fee)
    console.log(`\n💳 CREDITS VALUE CALCULATION:`);
    console.log(`   Credits available: ${(card.credits || []).length}`);
    const creditsValue = (card.credits || []).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, credit: any) => {
        // usage_ease: 0 = hard (0% value), 1 = easy (100% value)
        const adjustedValue = credit.value * (credit.usage_ease || 0);
        console.log(
          `   - ${credit.name.padEnd(25)}: $${credit.value
            .toFixed(2)
            .padStart(8)} × ${(credit.usage_ease || 0).toFixed(
            2
          )} = $${adjustedValue.toFixed(2)}`
        );
        return sum + adjustedValue;
      },
      0
    );
    console.log(`   ✅ Total Credits Value: $${creditsValue.toFixed(2)}`);

    console.log(`\n🎁 BENEFITS VALUE CALCULATION (excluding intro-bonus):`);
    const nonIntroBenefits = (card.benefits || []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.name !== "intro-bonus"
    );
    console.log(`   Benefits available: ${nonIntroBenefits.length}`);
    const benefitsValue = nonIntroBenefits.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, benefit: any) => {
        // usage_ease: 0 = hard (0% value), 1 = easy (100% value)
        const adjustedValue = benefit.value * (benefit.usage_ease || 0);
        console.log(
          `   - ${benefit.name.padEnd(25)}: $${benefit.value
            .toFixed(2)
            .padStart(8)} × ${(benefit.usage_ease || 0).toFixed(
            2
          )} = $${adjustedValue.toFixed(2)}`
        );
        return sum + adjustedValue;
      },
      0
    );
    console.log(`✅ Total Benefits Value: $${benefitsValue.toFixed(2)}`);

    console.log(`\n🎉 INTRO BONUS CALCULATION:`);
    const introBonus = (card.benefits || []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.name === "intro-bonus"
    );
    const introBonusValue = introBonus
      ? introBonus.usage_ease * introBonus.value
      : 0;

    const annualFee = card.annual_fee || 0;

    const totalRewards =
      estimatedRewards + creditsValue + benefitsValue + introBonusValue;

    const annualValue = totalRewards - annualFee;
    return {
      ...card,
      totalRewards,
      estimatedRewards,
      annualValue,
      introBonusValue,
      creditsValue,
      benefitsValue,
    };
  });

  // Sort by annual value (descending)
  recommendedCards.sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) => (b.annualValue || 0) - (a.annualValue || 0)
  );
  console.log(recommendedCards, "recommendedCards");
  return [recommendedCards, message];
}

/**
 * Analyze spending categories from transaction data
 * Filters out credits/payments and groups by category
 */
export function analyzeSpendingCategories(
  transactions: Transaction[]
): SpendingCategory[] {
  const categoryTotals: Record<string, number> = {};
  let totalSpending = 0;

  // Filter and aggregate spending by category
  transactions.forEach((transaction) => {
    // Filter out positive amounts (credits/refunds) and payments
    // Plaid transactions: negative = spending, positive = credits
    const isSpending =
      transaction.amount < 0 ||
      (transaction.amount > 0 &&
        !transaction.category?.some((cat) =>
          cat.toLowerCase().includes("payment")
        ));

    if (isSpending) {
      const amount = Math.abs(transaction.amount);
      totalSpending += amount;

      // Use first category from Plaid's category array, or "Other" if none
      const category = transaction.category?.[0] || "Other";
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    }
  });

  // Convert to array and calculate percentages
  const categories: SpendingCategory[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by amount descending

  return categories;
}
