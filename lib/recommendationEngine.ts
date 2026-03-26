/**
 * Re-export barrel for backward compatibility.
 * All logic now lives in lib/recommendation/.
 */
export {
  calculateTransactionRewards as calculateEstimatedRewards,
  getRecommendedCards,
  getMultiCardRecommendations,
  calculateCardAnnualValue,
  calculateCardAnnualValueFromRewards,
  calculateCreditsValue,
  calculateBenefitsValue,
  calculateIntroBonusValue,
  mapTransactionCategoryToRewardCategory,
  allocateSpendingToCards,
  evaluateCardCombination,
  filterByPreferences,
  isCardOwned,
} from "./recommendation";

export type {
  CreditCardData,
  CreditCardWithValue,
  Reward,
  Credit,
  Benefit,
  SpendingAllocation,
  SpendingCategory,
  CardValueResult,
  MultiCardRecommendation,
} from "./recommendation";

export type { PersonalFinanceCategory, Transaction } from "./types";
