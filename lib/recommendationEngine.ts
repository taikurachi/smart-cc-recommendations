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
    if (
      secondary === "groceries" ||
      secondary === "grocery stores" ||
      secondary === "supermarkets"
    ) {
      return ["grocery"];
    }
    // Online grocery delivery services
    if (
      secondary === "online" ||
      secondary === "online shopping" ||
      secondary === "delivery"
    ) {
      return ["online-groceries"];
    }
    return ["general"];
  }

  // Travel
  if (primary === "travel") {
    if (
      secondary === "airlines" ||
      secondary === "flights" ||
      secondary === "airports"
    ) {
      return ["travel"];
    }
    if (secondary === "hotels" || secondary === "lodging") {
      return ["hotels"];
    }
    if (
      secondary === "car rentals" ||
      secondary === "rideshare" ||
      secondary === "taxis" ||
      secondary === "transit"
    ) {
      return ["travel"];
    }
    return ["travel"];
  }

  // General Merchandise
  if (primary === "general merchandise") {
    if (
      secondary === "online" ||
      secondary === "online shopping" ||
      secondary === "e-commerce"
    ) {
      return ["online-shopping"];
    }
    if (secondary === "drugstores" || secondary === "pharmacies") {
      return ["drugstores"];
    }
    // Wholesale clubs (Costco, Sam's Club, BJ's)
    if (
      secondary === "wholesale clubs" ||
      secondary === "warehouse clubs" ||
      secondary === "membership warehouses"
    ) {
      return ["wholesale-clubs"];
    }
    return ["general"];
  }

  // Gas Stations
  if (primary === "gas stations" || primary === "gas") {
    return ["gas"];
  }

  // Entertainment
  if (primary === "entertainment") {
    // Streaming services (Netflix, Spotify, etc.)
    if (
      secondary === "streaming" ||
      secondary === "music" ||
      secondary === "video" ||
      secondary === "subscriptions"
    ) {
      return ["streaming"];
    }
    return ["general"];
  }

  // Service (utilities, phone, internet)
  if (primary === "service") {
    // Streaming services might be categorized here
    if (
      secondary === "streaming" ||
      secondary === "internet" ||
      secondary === "cable" ||
      secondary === "telecommunications"
    ) {
      return ["streaming"];
    }
    return ["general"];
  }

  // Shops (various retail categories)
  if (primary === "shops") {
    // Wholesale clubs
    if (
      secondary === "wholesale clubs" ||
      secondary === "warehouse clubs" ||
      secondary === "membership warehouses"
    ) {
      return ["wholesale-clubs"];
    }
    // Online shopping
    if (
      secondary === "online" ||
      secondary === "e-commerce" ||
      secondary === "internet"
    ) {
      return ["online-shopping"];
    }
    // Drugstores
    if (secondary === "pharmacies" || secondary === "drugstores") {
      return ["drugstores"];
    }
    return ["general"];
  }

  // Recreation (gyms, sports, etc.)
  if (primary === "recreation") {
    return ["general"];
  }

  // Transportation (rideshare, transit, parking)
  if (primary === "transportation") {
    if (
      secondary === "rideshare" ||
      secondary === "taxis" ||
      secondary === "transit" ||
      secondary === "public transit"
    ) {
      return ["travel"];
    }
    return ["general"];
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

    console.log(
      `\n🎉 INTRO BONUS CALCULATION (display only, not included in annual value):`
    );
    const introBonus = (card.benefits || []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.name === "intro-bonus"
    );
    const introBonusValue = introBonus
      ? introBonus.usage_ease * introBonus.value
      : 0;

    const annualFee = card.annual_fee || 0;

    // Total rewards = transaction rewards + credits + benefits (excludes intro bonus - it's one-time)
    const totalRewards = estimatedRewards + creditsValue + benefitsValue;

    // Annual value = total rewards - annual fee (intro bonus excluded as it's a one-time benefit)
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
 * Interface for spending allocation across cards
 */
export interface SpendingAllocation {
  cardId: string;
  cardName: string;
  category: string;
  amount: number;
  rewardRate: number;
  rewardValue: number;
}

/**
 * Interface for multi-card recommendation result
 */
export interface MultiCardRecommendation {
  cards: any[]; // Array of 2-3 recommended cards
  combinedAnnualValue: number;
  combinedTotalRewards: number;
  combinedAnnualFees: number;
  allocation: SpendingAllocation[];
  message?: string;
}

/**
 * Allocates spending optimally across multiple cards
 * Returns allocation map: cardId -> category -> amount
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function allocateSpendingToCards(
  cards: any[],
  transactions: any[]
): SpendingAllocation[] {
  // First, aggregate spending by reward category
  const categorySpending: Record<string, number> = {};

  transactions.forEach((transaction) => {
    if (transaction.amount <= 0) return; // Only process spending

    const amount = Math.abs(transaction.amount);
    const rewardCategories = mapTransactionCategoryToRewardCategory(
      transaction.category || []
    );

    rewardCategories.forEach((category) => {
      categorySpending[category] = (categorySpending[category] || 0) + amount;
    });
  });

  const allocation: SpendingAllocation[] = [];

  // For each spending category, find the best card and allocate spending
  Object.entries(categorySpending).forEach(([category, totalSpending]) => {
    // Find the best card for this category (highest reward rate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bestCard: any = null;
    let bestRate = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bestReward: any = null;

    cards.forEach((card) => {
      const reward = card.rewards?.[category];
      if (!reward) return;

      // Calculate effective rate
      let rate = 0;
      if (reward.unit === "points") {
        rate = reward.rate * 100 * 0.01; // Convert points to cash value
      } else {
        rate = reward.rate; // Cash back percentage
      }

      if (rate > bestRate) {
        bestRate = rate;
        bestCard = card;
        bestReward = reward;
      }
    });

    if (!bestCard || !bestReward) {
      // No card has this category, allocate to general if available
      cards.forEach((card) => {
        const generalReward = card.rewards?.["general"];
        if (generalReward && !bestCard) {
          let rate = 0;
          if (generalReward.unit === "points") {
            rate = generalReward.rate * 100 * 0.01;
          } else {
            rate = generalReward.rate;
          }
          if (rate > bestRate) {
            bestRate = rate;
            bestCard = card;
            bestReward = generalReward;
          }
        }
      });
    }

    if (bestCard && bestReward) {
      // Apply caps if they exist
      let cappedSpending = totalSpending;
      let remainingSpending = 0;
      if (bestReward.cap) {
        if (bestReward.cap.quarterly) {
          const annualCap = bestReward.cap.quarterly * 4;
          cappedSpending = Math.min(totalSpending, annualCap);
          remainingSpending = totalSpending - cappedSpending;
        } else if (bestReward.cap.annual) {
          cappedSpending = Math.min(totalSpending, bestReward.cap.annual);
          remainingSpending = totalSpending - cappedSpending;
        }
      }

      // Calculate reward value
      let rewardValue: number;
      if (bestReward.unit === "points") {
        const pointsPerDollar = bestReward.rate * 100;
        const pointsEarned = cappedSpending * pointsPerDollar;
        rewardValue = pointsEarned * 0.01;
      } else {
        rewardValue = cappedSpending * bestReward.rate;
      }

      allocation.push({
        cardId: bestCard.id || bestCard.name,
        cardName: bestCard.name,
        category,
        amount: cappedSpending,
        rewardRate: bestRate,
        rewardValue,
      });

      // If spending was capped, allocate remaining to next best card
      if (remainingSpending > 0) {
        const remainingCards = cards.filter(
          (c) => (c.id || c.name) !== (bestCard.id || bestCard.name)
        );
        if (remainingCards.length > 0) {
          // Find next best card for this category
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let nextBestCard: any = null;
          let nextBestRate = 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let nextBestReward: any = null;

          remainingCards.forEach((card) => {
            const reward = card.rewards?.[category];
            if (!reward) {
              // Try general category
              const generalReward = card.rewards?.["general"];
              if (generalReward) {
                let rate = 0;
                if (generalReward.unit === "points") {
                  rate = generalReward.rate * 100 * 0.01;
                } else {
                  rate = generalReward.rate;
                }
                if (rate > nextBestRate) {
                  nextBestRate = rate;
                  nextBestCard = card;
                  nextBestReward = generalReward;
                }
              }
              return;
            }

            let rate = 0;
            if (reward.unit === "points") {
              rate = reward.rate * 100 * 0.01;
            } else {
              rate = reward.rate;
            }

            if (rate > nextBestRate) {
              nextBestRate = rate;
              nextBestCard = card;
              nextBestReward = reward;
            }
          });

          if (nextBestCard && nextBestReward) {
            // Calculate reward for remaining spending
            let remainingRewardValue: number;
            if (nextBestReward.unit === "points") {
              const pointsPerDollar = nextBestReward.rate * 100;
              const pointsEarned = remainingSpending * pointsPerDollar;
              remainingRewardValue = pointsEarned * 0.01;
            } else {
              remainingRewardValue = remainingSpending * nextBestReward.rate;
            }

            allocation.push({
              cardId: nextBestCard.id || nextBestCard.name,
              cardName: nextBestCard.name,
              category,
              amount: remainingSpending,
              rewardRate: nextBestRate,
              rewardValue: remainingRewardValue,
            });
          }
        }
      }
    }
  });

  return allocation;
}

/**
 * Evaluates a combination of cards and returns total annual value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evaluateCardCombination(
  cards: any[],
  transactions: any[]
): {
  totalAnnualValue: number;
  totalRewards: number;
  totalFees: number;
  allocation: SpendingAllocation[];
} {
  // Allocate spending optimally across cards
  const allocation = allocateSpendingToCards(cards, transactions);

  // Calculate total rewards from allocation
  const totalRewardsFromAllocation = allocation.reduce(
    (sum, alloc) => sum + alloc.rewardValue,
    0
  );

  // Calculate credits and benefits for each card (using getRewardsEstimates logic)
  let totalCredits = 0;
  let totalBenefits = 0;

  cards.forEach((card) => {
    // Credits
    const creditsValue = (card.credits || []).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, credit: any) => {
        return sum + credit.value * (credit.usage_ease || 0);
      },
      0
    );

    // Benefits (excluding intro bonus)
    const nonIntroBenefits = (card.benefits || []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.name !== "intro-bonus"
    );
    const benefitsValue = nonIntroBenefits.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, benefit: any) => {
        return sum + benefit.value * (benefit.usage_ease || 0);
      },
      0
    );

    totalCredits += creditsValue;
    totalBenefits += benefitsValue;
  });

  // Calculate total fees
  const totalFees = cards.reduce(
    (sum, card) => sum + (card.annual_fee || 0),
    0
  );

  // Total rewards = allocation rewards + credits + benefits
  const totalRewards =
    totalRewardsFromAllocation + totalCredits + totalBenefits;

  // Annual value = total rewards - total fees
  const totalAnnualValue = totalRewards - totalFees;

  return {
    totalAnnualValue,
    totalRewards,
    totalFees,
    allocation,
  };
}

/**
 * Checks if a card is owned by the user
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isCardOwned(card: any, ownedCards: any[]): boolean {
  if (!ownedCards || ownedCards.length === 0) return false;

  return ownedCards.some((owned) => {
    // Match by ID (most reliable)
    if (card.id && owned.id && card.id === owned.id) return true;

    // Match by normalized name
    const normalize = (name: string) =>
      name?.replace(/[®™]/g, "").trim().toLowerCase() || "";
    const cardName = normalize(card.name);
    const ownedName = normalize(owned.name);

    return cardName === ownedName && cardName !== "";
  });
}

/**
 * Get multi-card recommendations (2-3 cards) that maximize total annual value
 * Returns the same structure as getRecommendedCards: [recommendedCards, message]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMultiCardRecommendations(
  transactions: any[],
  preferences: any,
  ownedCards: any[] = [],
  ownedCardsAnnualValue?: number // Pre-calculated annual value from page.tsx
): Promise<[any[], string | undefined]> {
  const creditCards = await loadCreditCardData();
  let message: string | undefined;

  // Filter cards based on preferences (same logic as getRecommendedCards)
  const preferencesArr = Object.entries(preferences)
    .filter(([, value]) => value)
    .map(([key]) => key);

  let preferredCreditCards = creditCards.filter((card) => {
    const tags = card.tags || [];
    return preferencesArr.every((pref) => tags.includes(pref));
  });

  if (preferredCreditCards.length === 0) {
    preferredCreditCards = creditCards.filter((card) => {
      const tags = card.tags || [];
      return preferencesArr.some((pref) => tags.includes(pref));
    });
  }

  if (preferredCreditCards.length === 0) {
    message = "There were no matches. Recommending you best value cards.";
  }

  const cardsToProcess =
    preferredCreditCards.length === 0 ? creditCards : preferredCreditCards;

  // Filter out owned cards
  const availableCards = cardsToProcess.filter(
    (card) => !isCardOwned(card, ownedCards)
  );

  if (availableCards.length === 0) {
    return [
      [],
      "All recommended cards are already owned. Your cards are optimized!",
    ];
  }

  // Greedy approach: Start with best single card, then add best complements
  let bestCombination: any[] = [];
  let bestValue = -Infinity;
  let bestAllocation: SpendingAllocation[] = [];

  // Try combinations of 2-3 cards
  for (let comboSize = 2; comboSize <= 3; comboSize++) {
    // Generate all combinations of this size
    const combinations = generateCombinations(availableCards, comboSize);

    for (const combo of combinations) {
      const evaluation = evaluateCardCombination(combo, transactions);

      if (evaluation.totalAnnualValue > bestValue) {
        bestValue = evaluation.totalAnnualValue;
        bestCombination = combo;
        bestAllocation = evaluation.allocation;
      }
    }
  }

  // If no good combination found, try single card as fallback
  if (bestCombination.length === 0 && availableCards.length > 0) {
    const singleCardEval = evaluateCardCombination(
      [availableCards[0]],
      transactions
    );
    bestCombination = [availableCards[0]];
    bestValue = singleCardEval.totalAnnualValue;
    bestAllocation = singleCardEval.allocation;
  }

  if (bestCombination.length === 0) {
    return [[], "No suitable card combinations found."];
  }

  // Calculate individual card values (same structure as getRecommendedCards)
  const recommendedCards = bestCombination.map((card) => {
    // Calculate estimated rewards for this card using the allocation
    const cardAllocations = bestAllocation.filter(
      (alloc) => alloc.cardId === (card.id || card.name)
    );
    const estimatedRewards = cardAllocations.reduce(
      (sum, alloc) => sum + alloc.rewardValue,
      0
    );

    // Calculate credits value
    const creditsValue = (card.credits || []).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, credit: any) => {
        return sum + credit.value * (credit.usage_ease || 0);
      },
      0
    );

    // Calculate benefits value (excluding intro bonus)
    const nonIntroBenefits = (card.benefits || []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.name !== "intro-bonus"
    );
    const benefitsValue = nonIntroBenefits.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, benefit: any) => {
        return sum + benefit.value * (benefit.usage_ease || 0);
      },
      0
    );

    // Calculate intro bonus value (display only)
    const introBonus = (card.benefits || []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.name === "intro-bonus"
    );
    const introBonusValue = introBonus
      ? introBonus.usage_ease * introBonus.value
      : 0;

    const annualFee = card.annual_fee || 0;

    // Total rewards = estimated rewards + credits + benefits (excludes intro bonus)
    const totalRewards = estimatedRewards + creditsValue + benefitsValue;

    // Annual value = total rewards - annual fee
    const annualValue = totalRewards - annualFee;

    return {
      ...card,
      totalRewards,
      estimatedRewards,
      annualValue,
      introBonusValue,
      creditsValue,
      benefitsValue,
      // Add allocation info for this card (optional, for UI display)
      allocation: cardAllocations,
    };
  });

  // Sort by annual value (descending)
  recommendedCards.sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) => (b.annualValue || 0) - (a.annualValue || 0)
  );

  // Calculate total annual value of recommended cards
  const recommendedTotalAnnualValue = recommendedCards.reduce(
    (sum, card) => sum + (card.annualValue || 0),
    0
  );

  // Calculate owned cards' total annual value to ensure recommendations are better
  if (ownedCards.length > 0) {
    let ownedCardsTotalAnnualValue = 0;

    // Use pre-calculated annual value if provided (from page.tsx where cards are calculated with filtered transactions)
    // Otherwise, recalculate using all transactions (for testing scenarios)
    if (ownedCardsAnnualValue !== undefined) {
      ownedCardsTotalAnnualValue = ownedCardsAnnualValue;
    } else {
      // Fallback: recalculate using all transactions (for testing or when pre-calculated value not available)
      const { calculateEstimatedRewards } = await import(
        "./recommendationEngine"
      );
      const { getRewardsEstimates, mapCardNameToOfficialCard } = await import(
        "./generalHelpers"
      );

      for (const ownedCard of ownedCards) {
        const officialCard = await mapCardNameToOfficialCard(
          ownedCard.name,
          ownedCard.institution_name
        );

        if (officialCard) {
          const estimatedRewards = calculateEstimatedRewards(
            officialCard,
            transactions
          );
          const { creditsValue, benefitsValue } =
            getRewardsEstimates(officialCard);
          const totalRewards = estimatedRewards + creditsValue + benefitsValue;
          const annualValue = totalRewards - (officialCard.annual_fee || 0);
          ownedCardsTotalAnnualValue += annualValue;
        }
      }
    }

    // Only return recommendations if they're better than owned cards
    if (recommendedTotalAnnualValue < ownedCardsTotalAnnualValue) {
      return [
        [],
        "Your current cards already provide the best value. No better recommendations found.",
      ];
    }
  }

  return [recommendedCards, message];
}

/**
 * Generate all combinations of a given size from an array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateCombinations(arr: any[], size: number): any[][] {
  if (size === 0) return [[]];
  if (size > arr.length) return [];

  const combinations: any[][] = [];

  function backtrack(start: number, current: any[]) {
    if (current.length === size) {
      combinations.push([...current]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return combinations;
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
