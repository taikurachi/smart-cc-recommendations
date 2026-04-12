import {
  CategorySpending,
  Credit,
  CreditValueBreakdown,
  Transaction,
} from "./types";
import type { BenefitMultipliers } from "../types";
import { resolveMultiplier } from "./benefitDefaults";
import { getAnnualizedMatchedSpendForCredit } from "./creditMatcher";

/**
 * Calculate the spending-aware value of a card's credits.
 *
 * When `categorySpending` is provided and a credit has a `category`,
 * its effective value is capped by actual annualized spending in that
 * category (you can't redeem more credit than you spend).
 * Merchant-name matching is reserved for explicit statement credits.
 *
 * When `benefitMultipliers` is provided, the user's multiplier for the
 * matching benefit category replaces the card-data `usage_ease`.
 */
export function calculateCreditBreakdowns(
  credits: Credit[],
  categorySpending?: CategorySpending,
  benefitMultipliers?: BenefitMultipliers,
  transactions: Transaction[] = [],
): CreditValueBreakdown[] {
  if (!credits || credits.length === 0) return [];

  return credits.map((credit) => {
    const matchedSpend = getAnnualizedMatchedSpendForCredit(credit, transactions);
    if (matchedSpend !== null) {
      const usageEase = resolveMultiplier(credit.name, 1, benefitMultipliers);
      const eligibleAmount = Math.min(credit.value, matchedSpend);
      return {
        name: credit.name,
        value: credit.value,
        usageEase,
        category: credit.category,
        matchedSpend,
        categorySpend: null,
        eligibleAmount,
        countedValue: eligibleAmount * usageEase,
        source: "merchant_match",
      };
    }

    let effectiveValue = credit.value;
    let source: CreditValueBreakdown["source"] = "usage_ease";
    let categorySpend: number | null = null;
    if (credit.category && categorySpending) {
      categorySpend = categorySpending[credit.category] ?? 0;
      effectiveValue = Math.min(credit.value, categorySpend);
      source = "category_spend";
    }
    const usageEase = resolveMultiplier(
      credit.name,
      credit.usage_ease || 0,
      benefitMultipliers,
    );
    return {
      name: credit.name,
      value: credit.value,
      usageEase,
      category: credit.category,
      matchedSpend: null,
      categorySpend,
      eligibleAmount: effectiveValue,
      countedValue: effectiveValue * usageEase,
      source,
    };
  });
}

export function calculateCreditsValue(
  credits: Credit[],
  categorySpending?: CategorySpending,
  benefitMultipliers?: BenefitMultipliers,
  transactions: Transaction[] = [],
): number {
  return calculateCreditBreakdowns(
    credits,
    categorySpending,
    benefitMultipliers,
    transactions,
  ).reduce((sum, credit) => sum + credit.countedValue, 0);
}
