import { CategorySpending, CreditCardData, Transaction } from "./types";
import { NON_SPENDING_PRIMARIES } from "./constants";
import { mapTransactionCategoryToRewardCategory } from "./categoryMapper";

/**
 * Stable identity for a card — prefers `id`, falls back to `name`.
 */
export function getCardId(card: CreditCardData): string {
  return card.id || card.name;
}

/**
 * True when a transaction represents real consumer spending
 * (positive amount, not a loan payment / transfer / income / bank fee).
 */
export function isSpendingTransaction(transaction: Transaction): boolean {
  if (transaction.amount <= 0) return false;
  const primary = transaction.personal_finance_category?.primary;
  if (primary && NON_SPENDING_PRIMARIES.has(primary)) return false;
  return true;
}

/**
 * Determine the factor to scale observed transaction rewards to a full year.
 * Returns 1 when the span is too short (< 30 days) to extrapolate reliably.
 */
export function getAnnualizationFactor(transactions: Transaction[]): number {
  if (transactions.length < 2) return 1;

  const timestamps = transactions
    .map((t) => new Date(t.date).getTime())
    .filter((t) => !isNaN(t));

  if (timestamps.length < 2) return 1;

  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);
  const spanDays = (latest - earliest) / (1000 * 60 * 60 * 24);

  if (spanDays < 30) return 1;

  return 365 / spanDays;
}

/**
 * Compute annualized spending per reward category from transactions.
 * Filters to spending-only transactions, maps each to its reward category,
 * sums per category, then scales by the annualization factor.
 */
export function computeAnnualCategorySpending(
  transactions: Transaction[],
): CategorySpending {
  const spendingTxs = transactions.filter(isSpendingTransaction);
  const annualizationFactor = getAnnualizationFactor(spendingTxs);
  const spending: CategorySpending = {};

  spendingTxs.forEach((t) => {
    const cat = mapTransactionCategoryToRewardCategory(
      t.personal_finance_category,
    );
    spending[cat] = (spending[cat] || 0) + Math.abs(t.amount);
  });

  for (const cat of Object.keys(spending)) {
    spending[cat] *= annualizationFactor;
  }
  return spending;
}

/**
 * Generate all combinations of `size` elements from `arr`.
 */
export function generateCombinations<T>(arr: T[], size: number): T[][] {
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
