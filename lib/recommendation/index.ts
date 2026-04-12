/**
 * Recommendation engine entry point.
 *
 * Pipeline: filter cards by preferences -> map transaction categories ->
 * calculate per-card rewards/credits/benefits -> score cards ->
 * find optimal multi-card combinations.
 *
 * Sub-modules:
 *   cardFilter        – filter cards by user preference tags
 *   categoryMapper    – Plaid PFC -> reward category mapping
 *   rewardsCalculator – transaction-based reward value with caps
 *   creditsCalculator – annual statement credits valuation
 *   benefitsCalculator – card benefits & intro bonus valuation
 *   cardValueCalculator – composite annual value per card
 *   spendingAllocator – multi-card spending allocation optimizer
 */

import { loadCreditCardData } from "../data/creditCardData";
import {
  CategorySpending,
  CreditCardData,
  CreditCardWithValue,
  OwnedCardRef,
  RecommendationResult,
  SpendingAllocation,
  Transaction,
} from "./types";
import type { BenefitMultipliers } from "../types";
import {
  calculateCardAnnualValue,
  calculateCardAnnualValueFromRewards,
} from "./cardValueCalculator";
import { evaluateCardCombination } from "./spendingAllocator";
import { filterByPreferences, isCardOwned } from "./cardFilter";
import { mapCardNameToOfficialCard } from "../data/cardMatcher";
import {
  generateCombinations,
  getCardId,
} from "./utils";
import { MESSAGES } from "./constants";

export {
  calculateCardAnnualValue,
  calculateCardAnnualValueFromRewards,
} from "./cardValueCalculator";
export { calculateTransactionRewards } from "./rewardsCalculator";
export { calculateCreditsValue } from "./creditsCalculator";
export {
  calculateBenefitsValue,
  calculateIntroBonusValue,
} from "./benefitsCalculator";
export { mapTransactionCategoryToRewardCategory } from "./categoryMapper";
export {
  allocateSpendingToCards,
  evaluateCardCombination,
} from "./spendingAllocator";
export { filterByPreferences, isCardOwned } from "./cardFilter";
export {
  isSpendingTransaction,
  getAnnualizationFactor,
  computeAnnualCategorySpending,
} from "./utils";
export type {
  CategorySpending,
  CreditCardData,
  CreditCardWithValue,
  RecommendationResult,
  RewardCategory,
  Reward,
  Credit,
  Benefit,
  SpendingAllocation,
  SpendingCategory,
  CardValueResult,
  OwnedCardRef,
} from "./types";
export { rewardCategories } from "./types";

/**
 * Get recommended credit cards based on transactions (single-card ranking).
 * Pass `providedCards` to skip the DB/API load (useful for tests).
 */
export async function getRecommendedCards(
  transactions: Transaction[],
  preferences: Record<string, boolean>,
  providedCards?: CreditCardData[],
  benefitMultipliers?: BenefitMultipliers,
): Promise<RecommendationResult> {
  const creditCards = providedCards ?? (await loadCreditCardData());
  const [cardsToProcess, message] = filterByPreferences(
    creditCards,
    preferences,
  );

  const recommendedCards = cardsToProcess.map((card) => {
    const value = calculateCardAnnualValue(
      card,
      transactions,
      benefitMultipliers,
    );
    return { ...card, ...value };
  });

  recommendedCards.sort((a, b) => b.annualValue - a.annualValue);
  return { cards: recommendedCards, message };
}

/**
 * Brute-force search for the best 2-3 card combination by total annual value.
 * Falls back to a single card if no multi-card combo exists.
 */
function findBestCombination(
  cards: CreditCardData[],
  transactions: Transaction[],
  benefitMultipliers?: BenefitMultipliers,
): {
  combo: CreditCardData[];
  allocation: SpendingAllocation[];
  categorySpending: CategorySpending;
} | null {
  let bestCombo: CreditCardData[] = [];
  let bestValue = -Infinity;
  let bestAllocation: SpendingAllocation[] = [];
  let bestCategorySpending: CategorySpending = {};

  for (let comboSize = 2; comboSize <= 3; comboSize++) {
    const combinations = generateCombinations(cards, comboSize);
    for (const combo of combinations) {
      const evaluation = evaluateCardCombination(
        combo,
        transactions,
        benefitMultipliers,
      );
      if (evaluation.totalAnnualValue > bestValue) {
        bestValue = evaluation.totalAnnualValue;
        bestCombo = combo;
        bestAllocation = evaluation.allocation;
        bestCategorySpending = evaluation.categorySpending;
      }
    }
  }

  if (bestCombo.length === 0 && cards.length > 0) {
    let bestSingleValue = -Infinity;
    for (const card of cards) {
      const evaluation = evaluateCardCombination(
        [card],
        transactions,
        benefitMultipliers,
      );
      if (evaluation.totalAnnualValue > bestSingleValue) {
        bestSingleValue = evaluation.totalAnnualValue;
        bestCombo = [card];
        bestAllocation = evaluation.allocation;
        bestCategorySpending = evaluation.categorySpending;
      }
    }
  }

  if (bestCombo.length === 0) return null;
  return {
    combo: bestCombo,
    allocation: bestAllocation,
    categorySpending: bestCategorySpending,
  };
}

/**
 * Build per-card value results from a combination and its spending allocation.
 */
function buildCombinationResults(
  combo: CreditCardData[],
  allocation: SpendingAllocation[],
  categorySpending: CategorySpending,
  transactions: Transaction[],
  benefitMultipliers?: BenefitMultipliers,
): CreditCardWithValue[] {
  const results = combo.map((card) => {
    const cardAllocations = allocation.filter(
      (alloc) => alloc.cardId === getCardId(card),
    );
    const estimatedRewards = cardAllocations.reduce(
      (sum, alloc) => sum + alloc.rewardValue,
      0,
    );
    const value = calculateCardAnnualValueFromRewards(
      card,
      estimatedRewards,
      categorySpending,
      benefitMultipliers,
      transactions,
    );
    return { ...card, ...value, allocation: cardAllocations };
  });

  results.sort((a, b) => b.annualValue - a.annualValue);
  return results;
}

/**
 * Calculate the total annual value of the user's currently owned cards.
 * Uses pre-computed value if available, otherwise resolves each card.
 */
async function computeOwnedCardsValue(
  ownedCards: OwnedCardRef[],
  ownedCardsAnnualValue: number | undefined,
  allCards: CreditCardData[],
  transactions: Transaction[],
  benefitMultipliers?: BenefitMultipliers,
): Promise<number> {
  if (ownedCardsAnnualValue !== undefined) return ownedCardsAnnualValue;

  const resolvedCards: CreditCardData[] = [];
  for (const ownedCard of ownedCards) {
    const officialCard = await mapCardNameToOfficialCard(
      ownedCard.name || "",
      ownedCard.institution_name,
      allCards,
    );
    if (officialCard) {
      resolvedCards.push(officialCard);
    }
  }

  if (resolvedCards.length === 0) return 0;

  const evaluation = evaluateCardCombination(
    resolvedCards,
    transactions,
    benefitMultipliers,
  );
  return evaluation.totalAnnualValue;
}

/**
 * Get multi-card recommendations (2-3 cards) that maximize total annual value.
 * Pass `providedCards` to skip the DB/API load (useful for tests).
 */
export async function getMultiCardRecommendations(
  transactions: Transaction[],
  preferences: Record<string, boolean>,
  ownedCards: OwnedCardRef[] = [],
  ownedCardsAnnualValue?: number,
  providedCards?: CreditCardData[],
  benefitMultipliers?: BenefitMultipliers,
): Promise<RecommendationResult> {
  const creditCards = providedCards ?? (await loadCreditCardData());
  const [filteredCards, filterMessage] = filterByPreferences(
    creditCards,
    preferences,
  );

  const availableCards = filteredCards.filter(
    (card) => !isCardOwned(card, ownedCards),
  );

  if (availableCards.length === 0) {
    return {
      cards: [],
      message: MESSAGES.ALL_OWNED,
    };
  }

  const best = findBestCombination(
    availableCards,
    transactions,
    benefitMultipliers,
  );
  if (!best) {
    return { cards: [], message: MESSAGES.NO_COMBOS };
  }

  const recommendedCards = buildCombinationResults(
    best.combo,
    best.allocation,
    best.categorySpending,
    transactions,
    benefitMultipliers,
  );

  if (ownedCards.length > 0) {
    const recommendedTotal = recommendedCards.reduce(
      (sum, card) => sum + card.annualValue,
      0,
    );
    const ownedTotal = await computeOwnedCardsValue(
      ownedCards,
      ownedCardsAnnualValue,
      creditCards,
      transactions,
      benefitMultipliers,
    );

    if (recommendedTotal < ownedTotal) {
      return {
        cards: [],
        message: MESSAGES.OWNED_BETTER,
      };
    }
  }

  return { cards: recommendedCards, message: filterMessage };
}
