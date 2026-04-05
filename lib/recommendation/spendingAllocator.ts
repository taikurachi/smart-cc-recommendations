import {
  CategorySpending,
  CreditCardData,
  Reward,
  SpendingAllocation,
  Transaction,
} from "./types";
import {
  applyCap,
  computeRewardValue,
  getEffectiveRate,
} from "./rewardsCalculator";
import { calculateCreditsValue } from "./creditsCalculator";
import { calculateBenefitsValue } from "./benefitsCalculator";
import {
  getCardId,
  computeAnnualCategorySpending,
} from "./utils";

/**
 * Find the card with the highest effective reward rate for a given category.
 * Considers both the specific category tier AND the general tier on every card
 * so a high general rate isn't overlooked when another card has a low specific tier.
 */
function findBestCardForCategory(
  cards: CreditCardData[],
  category: string,
): { card: CreditCardData; reward: Reward; rate: number } | null {
  let bestCard: CreditCardData | null = null;
  let bestRate = 0;
  let bestReward: Reward | null = null;

  for (const card of cards) {
    const specificReward = card.rewards?.[category];
    if (specificReward) {
      const rate = getEffectiveRate(specificReward);
      if (rate > bestRate) {
        bestRate = rate;
        bestCard = card;
        bestReward = specificReward;
      }
    }

    if (category !== "general") {
      const generalReward = card.rewards?.["general"];
      if (generalReward) {
        const rate = getEffectiveRate(generalReward);
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
 * When a cap is hit, overflow waterfalls to the next-best card until all
 * spending is allocated or all cards are exhausted.
 *
 * Non-spending transactions (transfers, loan payments, etc.) are excluded.
 * Partial-year data is annualized so allocations reflect a full year.
 */
export function allocateSpendingToCards(
  cards: CreditCardData[],
  transactions: Transaction[],
): SpendingAllocation[] {
  const allocation: SpendingAllocation[] = [];
  const categorySpending = computeAnnualCategorySpending(transactions);

  Object.entries(categorySpending).forEach(([category, totalSpending]) => {
    let remainingSpending = totalSpending;
    const usedCardIds = new Set<string>();

    while (remainingSpending > 0.01) {
      const availableCards = cards.filter(
        (c) => !usedCardIds.has(getCardId(c)),
      );
      if (availableCards.length === 0) break;

      const best = findBestCardForCategory(availableCards, category);
      if (!best) break;

      const cappedSpending = applyCap(remainingSpending, best.reward);

      allocation.push({
        cardId: getCardId(best.card),
        cardName: best.card.name,
        category,
        amount: cappedSpending,
        rewardRate: best.rate,
        rewardValue: computeRewardValue(cappedSpending, best.reward),
      });

      usedCardIds.add(getCardId(best.card));
      remainingSpending -= cappedSpending;
    }
  });

  return allocation;
}

/**
 * Evaluates a combination of cards: allocates spending, then sums rewards +
 * spending-aware credits + benefits across the set and subtracts combined
 * annual fees.
 */
export function evaluateCardCombination(
  cards: CreditCardData[],
  transactions: Transaction[],
): {
  totalAnnualValue: number;
  totalRewards: number;
  totalFees: number;
  allocation: SpendingAllocation[];
  categorySpending: CategorySpending;
} {
  const categorySpending = computeAnnualCategorySpending(transactions);
  const allocation = allocateSpendingToCards(cards, transactions);

  const totalRewardsFromAllocation = allocation.reduce(
    (sum, alloc) => sum + alloc.rewardValue,
    0,
  );

  let totalCredits = 0;
  let totalBenefits = 0;

  cards.forEach((card) => {
    totalCredits += calculateCreditsValue(card.credits || [], categorySpending);
    totalBenefits += calculateBenefitsValue(
      card.benefits || [],
      categorySpending,
    );
  });

  const totalFees = cards.reduce(
    (sum, card) => sum + (card.annual_fee || 0),
    0,
  );

  const totalRewards =
    totalRewardsFromAllocation + totalCredits + totalBenefits;
  const totalAnnualValue = totalRewards - totalFees;

  return {
    totalAnnualValue,
    totalRewards,
    totalFees,
    allocation,
    categorySpending,
  };
}
