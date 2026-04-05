import { CategorySpending, Credit } from "./types";
import type { BenefitMultipliers } from "../types";
import { resolveMultiplier } from "./benefitDefaults";

/**
 * Calculate the spending-aware value of a card's credits.
 *
 * When `categorySpending` is provided and a credit has a `category`,
 * its effective value is capped by actual annualized spending in that
 * category (you can't redeem more credit than you spend).
 *
 * When `benefitMultipliers` is provided, the user's multiplier for the
 * matching benefit category replaces the card-data `usage_ease`.
 */
export function calculateCreditsValue(
  credits: Credit[],
  categorySpending?: CategorySpending,
  benefitMultipliers?: BenefitMultipliers,
): number {
  if (!credits || credits.length === 0) return 0;
  return credits.reduce((sum, credit) => {
    let effectiveValue = credit.value;
    if (credit.category && categorySpending) {
      const spent = categorySpending[credit.category] ?? 0;
      effectiveValue = Math.min(credit.value, spent);
    }
    const usageEase = resolveMultiplier(
      credit.name,
      credit.usage_ease || 0,
      benefitMultipliers,
    );
    return sum + effectiveValue * usageEase;
  }, 0);
}
