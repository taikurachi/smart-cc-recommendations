import { loadCreditCardData } from "../creditCardData";
import { CreditCardData, SpendingAllocation, Transaction } from "./types";
import { calculateCardAnnualValue } from "./cardValueCalculator";
import { calculateCardAnnualValueFromRewards } from "./cardValueCalculator";
import {
  allocateSpendingToCards,
  evaluateCardCombination,
} from "./spendingAllocator";
import { filterByPreferences, isCardOwned } from "./cardFilter";
import { calculateTransactionRewards } from "./rewardsCalculator";
import { calculateCreditsValue } from "./creditsCalculator";
import { calculateBenefitsValue } from "./benefitsCalculator";
import { mapCardNameToOfficialCard } from "../generalHelpers";

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
export { allocateSpendingToCards, evaluateCardCombination } from "./spendingAllocator";
export { filterByPreferences, isCardOwned } from "./cardFilter";
export type {
  CreditCardData,
  Reward,
  Credit,
  Benefit,
  SpendingAllocation,
  SpendingCategory,
  CardValueResult,
  MultiCardRecommendation,
} from "./types";

function generateCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (size > arr.length) return [];

  const combinations: T[][] = [];

  function backtrack(start: number, current: T[]) {
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
 * Get recommended credit cards based on transactions (single-card ranking).
 * Pass `providedCards` to skip the DB/API load (useful for tests).
 */
export async function getRecommendedCards(
  transactions: Transaction[],
  preferences: Record<string, boolean>,
  providedCards?: CreditCardData[]
): Promise<[CreditCardData[], string | undefined]> {
  const creditCards =
    providedCards ?? ((await loadCreditCardData()) as CreditCardData[]);
  const [cardsToProcess, message] = filterByPreferences(
    creditCards,
    preferences
  );

  const recommendedCards = cardsToProcess.map((card) => {
    const value = calculateCardAnnualValue(card, transactions);
    return { ...card, ...value };
  });

  recommendedCards.sort((a, b) => b.annualValue - a.annualValue);
  return [recommendedCards, message];
}

/**
 * Get multi-card recommendations (2-3 cards) that maximize total annual value.
 * Pass `providedCards` to skip the DB/API load (useful for tests).
 */
export async function getMultiCardRecommendations(
  transactions: Transaction[],
  preferences: Record<string, boolean>,
  ownedCards: Array<{ id?: string; name?: string; institution_name?: string }> = [],
  ownedCardsAnnualValue?: number,
  providedCards?: CreditCardData[]
): Promise<[CreditCardData[], string | undefined]> {
  const creditCards =
    providedCards ?? ((await loadCreditCardData()) as CreditCardData[]);
  const [filteredCards, filterMessage] = filterByPreferences(
    creditCards,
    preferences
  );

  const availableCards = filteredCards.filter(
    (card) => !isCardOwned(card, ownedCards)
  );

  if (availableCards.length === 0) {
    return [
      [],
      "All recommended cards are already owned. Your cards are optimized!",
    ];
  }

  let bestCombination: CreditCardData[] = [];
  let bestValue = -Infinity;
  let bestAllocation: SpendingAllocation[] = [];

  for (let comboSize = 2; comboSize <= 3; comboSize++) {
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

  const recommendedCards = bestCombination.map((card) => {
    const cardAllocations = bestAllocation.filter(
      (alloc) => alloc.cardId === (card.id || card.name)
    );
    const estimatedRewards = cardAllocations.reduce(
      (sum, alloc) => sum + alloc.rewardValue,
      0
    );
    const value = calculateCardAnnualValueFromRewards(card, estimatedRewards);
    return { ...card, ...value, allocation: cardAllocations };
  });

  recommendedCards.sort((a, b) => b.annualValue - a.annualValue);

  const recommendedTotalAnnualValue = recommendedCards.reduce(
    (sum, card) => sum + card.annualValue,
    0
  );

  if (ownedCards.length > 0) {
    let ownedCardsTotalAnnualValue = 0;

    if (ownedCardsAnnualValue !== undefined) {
      ownedCardsTotalAnnualValue = ownedCardsAnnualValue;
    } else {
      for (const ownedCard of ownedCards) {
        const officialCard = await mapCardNameToOfficialCard(
          ownedCard.name || "",
          ownedCard.institution_name,
          creditCards
        );
        if (officialCard) {
          const txRewards = calculateTransactionRewards(
            officialCard,
            transactions
          );
          const creditsVal = calculateCreditsValue(officialCard.credits || []);
          const benefitsVal = calculateBenefitsValue(
            officialCard.benefits || []
          );
          const totalRewards = txRewards + creditsVal + benefitsVal;
          ownedCardsTotalAnnualValue +=
            totalRewards - (officialCard.annual_fee || 0);
        }
      }
    }

    if (recommendedTotalAnnualValue < ownedCardsTotalAnnualValue) {
      return [
        [],
        "Your current cards already provide the best value. No better recommendations found.",
      ];
    }
  }

  return [recommendedCards, filterMessage];
}
