import { Benefit, CategorySpending } from "./types";
import { INTRO_BONUS_KEY } from "./constants";

/**
 * Calculate the spending-aware value of a card's benefits,
 * excluding the one-time intro bonus.
 *
 * When `categorySpending` is provided and a benefit has a `category`,
 * the benefit is valued only if the user has actual spending in that
 * category (you don't benefit from travel insurance if you don't travel).
 *
 * Benefits without a `category` or calls without `categorySpending`
 * fall back to the original `value * usage_ease` behavior.
 */
export function calculateBenefitsValue(
  benefits: Benefit[],
  categorySpending?: CategorySpending,
): number {
  if (!benefits || benefits.length === 0) return 0;
  return benefits
    .filter((b) => b.name !== INTRO_BONUS_KEY)
    .reduce((sum, b) => {
      const hasRelevantSpending =
        !b.category ||
        !categorySpending ||
        (categorySpending[b.category] ?? 0) > 0;
      return (
        sum + b.value * (b.usage_ease || 0) * (hasRelevantSpending ? 1 : 0)
      );
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
