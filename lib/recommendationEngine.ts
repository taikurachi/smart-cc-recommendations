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
  Reward,
  Credit,
  Benefit,
  SpendingAllocation,
  SpendingCategory,
  CardValueResult,
  MultiCardRecommendation,
} from "./recommendation";

import { PersonalFinanceCategory, Transaction } from "./types";
export type { PersonalFinanceCategory, Transaction };

/**
 * Analyze spending categories from transaction data.
 * Kept here for backward compatibility; consider importing from
 * lib/spendingAnalyzer for UI-facing spending analysis instead.
 */
export function analyzeSpendingCategories(
  transactions: Transaction[]
): { category: string; amount: number; percentage: number }[] {
  const categoryTotals: Record<string, number> = {};
  let totalSpending = 0;

  const paymentPrimaries = new Set([
    "LOAN_PAYMENTS",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "INCOME",
  ]);

  transactions.forEach((transaction) => {
    const isSpending =
      transaction.amount < 0 ||
      (transaction.amount > 0 &&
        !paymentPrimaries.has(
          transaction.personal_finance_category?.primary ?? ""
        ));

    if (isSpending) {
      const amount = Math.abs(transaction.amount);
      totalSpending += amount;
      const category =
        transaction.personal_finance_category?.primary || "Other";
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    }
  });

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}
