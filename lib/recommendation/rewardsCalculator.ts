import { CreditCardData, Reward, Transaction } from "./types";
import { mapTransactionCategoryToRewardCategory } from "./categoryMapper";

/**
 * Compute the cash value produced by a single reward tier for a given spending amount.
 * Points are valued at $0.01 each (rate * 100 = points-per-dollar).
 */
export function computeRewardValue(
  spending: number,
  reward: Reward
): number {
  if (reward.unit === "points") {
    const pointsPerDollar = reward.rate * 100;
    return spending * pointsPerDollar * 0.01;
  }
  return spending * reward.rate;
}

/**
 * Apply quarterly or annual spending caps, returning the capped amount.
 */
export function applyCap(spending: number, reward: Reward): number {
  if (!reward.cap) return spending;
  if (reward.cap.quarterly) {
    return Math.min(spending, reward.cap.quarterly * 4);
  }
  if (reward.cap.annual) {
    return Math.min(spending, reward.cap.annual);
  }
  return spending;
}

/**
 * Calculate estimated annual transaction-based rewards for a credit card.
 * Aggregates spending by reward category, matches to the card's reward tiers,
 * applies caps, and returns the total cash value earned.
 */
export function calculateTransactionRewards(
  card: CreditCardData,
  transactions: Transaction[]
): number {
  const categorySpending: Record<string, number> = {};
  const cardRewardCategories = new Set(
    card.rewards ? Object.keys(card.rewards) : []
  );
  const hasGeneralCategory = cardRewardCategories.has("general");

  transactions.forEach((transaction) => {
    if (transaction.amount <= 0) return;

    const amount = Math.abs(transaction.amount);
    const rewardCategories = mapTransactionCategoryToRewardCategory(
      transaction.personal_finance_category
    );

    const matchedCategories = rewardCategories.filter(
      (cat) => cat !== "general" && cardRewardCategories.has(cat)
    );

    if (matchedCategories.length > 0) {
      matchedCategories.forEach((rewardCategory) => {
        categorySpending[rewardCategory] =
          (categorySpending[rewardCategory] || 0) + amount;
      });
    } else if (hasGeneralCategory) {
      categorySpending["general"] =
        (categorySpending["general"] || 0) + amount;
    }
  });

  let totalRewards = 0;

  if (card.rewards) {
    Object.entries(card.rewards).forEach(([category, reward]) => {
      const spending = categorySpending[category] || 0;
      if (spending === 0) return;

      const cappedSpending = applyCap(spending, reward);
      totalRewards += computeRewardValue(cappedSpending, reward);
    });
  }

  return totalRewards;
}
