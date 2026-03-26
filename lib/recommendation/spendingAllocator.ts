import {
  CreditCardData,
  Reward,
  SpendingAllocation,
  Transaction,
} from "./types";
import { mapTransactionCategoryToRewardCategory } from "./categoryMapper";
import { applyCap, computeRewardValue } from "./rewardsCalculator";
import { calculateCreditsValue } from "./creditsCalculator";
import { calculateBenefitsValue } from "./benefitsCalculator";

/**
 * Compute the effective cash-back-equivalent rate for a reward tier.
 */
function effectiveRate(reward: Reward): number {
  if (reward.unit === "points") {
    return reward.rate * 100 * 0.01;
  }
  return reward.rate;
}

/**
 * Find the card with the highest effective reward rate for a given category.
 * Falls back to "general" if no card has a specific tier for the category.
 */
function findBestCardForCategory(
  cards: CreditCardData[],
  category: string
): { card: CreditCardData; reward: Reward; rate: number } | null {
  let bestCard: CreditCardData | null = null;
  let bestRate = 0;
  let bestReward: Reward | null = null;

  for (const card of cards) {
    const reward = card.rewards?.[category];
    if (reward) {
      const rate = effectiveRate(reward);
      if (rate > bestRate) {
        bestRate = rate;
        bestCard = card;
        bestReward = reward;
      }
    }
  }

  if (!bestCard || !bestReward) {
    for (const card of cards) {
      const generalReward = card.rewards?.["general"];
      if (generalReward) {
        const rate = effectiveRate(generalReward);
        if (rate > bestRate) {
          bestRate = rate;
          bestCard = card;
          bestReward = generalReward;
        }
      }
    }
  }

  if (bestCard && bestReward) {
    return { card: bestCard, reward: bestReward, rate: bestRate };
  }
  return null;
}

/**
 * Allocates spending optimally across multiple cards.
 * For each reward category, assigns spending to the card with the highest rate.
 * When a cap is hit, overflow goes to the next-best card.
 */
export function allocateSpendingToCards(
  cards: CreditCardData[],
  transactions: Transaction[]
): SpendingAllocation[] {
  const allocation: SpendingAllocation[] = [];
  const categorySpending: Record<string, number> = {};

  transactions.forEach((transaction) => {
    if (transaction.amount <= 0) return;
    const amount = Math.abs(transaction.amount);
    const primaryCategory = mapTransactionCategoryToRewardCategory(
      transaction.personal_finance_category
    );
    categorySpending[primaryCategory] =
      (categorySpending[primaryCategory] || 0) + amount;
  });

  Object.entries(categorySpending).forEach(([category, totalSpending]) => {
    const best = findBestCardForCategory(cards, category);
    if (!best) return;

    const cappedSpending = applyCap(totalSpending, best.reward);
    const remainingSpending = totalSpending - cappedSpending;

    allocation.push({
      cardId: best.card.id || best.card.name,
      cardName: best.card.name,
      category,
      amount: cappedSpending,
      rewardRate: best.rate,
      rewardValue: computeRewardValue(cappedSpending, best.reward),
    });

    if (remainingSpending > 0) {
      const remainingCards = cards.filter(
        (c) => (c.id || c.name) !== (best.card.id || best.card.name)
      );
      const nextBest = findBestCardForCategory(remainingCards, category);
      if (nextBest) {
        allocation.push({
          cardId: nextBest.card.id || nextBest.card.name,
          cardName: nextBest.card.name,
          category,
          amount: remainingSpending,
          rewardRate: nextBest.rate,
          rewardValue: computeRewardValue(remainingSpending, nextBest.reward),
        });
      }
    }
  });

  return allocation;
}

/**
 * Evaluates a combination of cards: allocates spending, then sums rewards +
 * credits + benefits across the set and subtracts combined annual fees.
 */
export function evaluateCardCombination(
  cards: CreditCardData[],
  transactions: Transaction[]
): {
  totalAnnualValue: number;
  totalRewards: number;
  totalFees: number;
  allocation: SpendingAllocation[];
} {
  const allocation = allocateSpendingToCards(cards, transactions);

  const totalRewardsFromAllocation = allocation.reduce(
    (sum, alloc) => sum + alloc.rewardValue,
    0
  );

  let totalCredits = 0;
  let totalBenefits = 0;

  cards.forEach((card) => {
    totalCredits += calculateCreditsValue(card.credits || []);
    totalBenefits += calculateBenefitsValue(card.benefits || []);
  });

  const totalFees = cards.reduce(
    (sum, card) => sum + (card.annual_fee || 0),
    0
  );

  const totalRewards =
    totalRewardsFromAllocation + totalCredits + totalBenefits;
  const totalAnnualValue = totalRewards - totalFees;

  return { totalAnnualValue, totalRewards, totalFees, allocation };
}
