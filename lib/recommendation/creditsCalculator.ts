import { CategorySpending, Credit } from "./types";

/**
 * Calculate the spending-aware value of a card's credits.
 *
 * When `categorySpending` is provided and a credit has a `category`,
 * its effective value is capped by actual annualized spending in that
 * category (you can't redeem more credit than you spend).
 *
 * Credits without a `category` or calls without `categorySpending`
 * fall back to the original `value * usage_ease` behavior.
 */
export function calculateCreditsValue(
  credits: Credit[],
  categorySpending?: CategorySpending,
): number {
  if (!credits || credits.length === 0) return 0;
  return credits.reduce((sum, credit) => {
    let effectiveValue = credit.value;
    if (credit.category && categorySpending) {
      const spent = categorySpending[credit.category] ?? 0;
      effectiveValue = Math.min(credit.value, spent);
    }
    return sum + effectiveValue * (credit.usage_ease || 0);
  }, 0);
}
