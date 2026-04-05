import { Benefit, CategorySpending } from "./types";
import type { BenefitMultipliers } from "../types";
import { INTRO_BONUS_KEY } from "./constants";
import { resolveMultiplier } from "./benefitDefaults";

/**
 * Calculate the spending-aware value of a card's benefits,
 * excluding the one-time intro bonus.
 *
 * When `categorySpending` is provided and a benefit has a `category`,
 * the benefit's effective value is capped by actual spending in that
 * category — you can't get $1,500 of trip cancellation value from $500
 * of travel spending. This mirrors the credits calculator approach.
 *
 * When `benefitMultipliers` is provided, the user's multiplier for the
 * matching benefit category replaces the card-data `usage_ease`.
 */
export function calculateBenefitsValue(
  benefits: Benefit[],
  categorySpending?: CategorySpending,
  benefitMultipliers?: BenefitMultipliers,
): number {
  if (!benefits || benefits.length === 0) return 0;
  return benefits
    .filter((b) => b.name !== INTRO_BONUS_KEY)
    .reduce((sum, b) => {
      let effectiveValue = b.value;
      if (b.category && categorySpending) {
        const spent = categorySpending[b.category] ?? 0;
        effectiveValue = Math.min(b.value, spent);
      }
      const usageEase = resolveMultiplier(
        b.name,
        b.usage_ease || 0,
        benefitMultipliers,
      );
      return sum + effectiveValue * usageEase;
    }, 0);
}

/**
 * Calculate the usage-ease-adjusted intro bonus value.
 * This is a one-time benefit shown separately from annual value.
 */
export function calculateIntroBonusValue(benefits: Benefit[]): number {
  if (!benefits || benefits.length === 0) return 0;
  const introBonus = benefits.find((b) => b.name === INTRO_BONUS_KEY);
  if (!introBonus) return 0;
  return introBonus.value * (introBonus.usage_ease || 0);
}
