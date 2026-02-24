import { Benefit } from "./types";

/**
 * Calculate the usage-ease-adjusted value of a card's benefits,
 * excluding the one-time intro bonus.
 */
export function calculateBenefitsValue(benefits: Benefit[]): number {
  if (!benefits || benefits.length === 0) return 0;
  return benefits
    .filter((b) => b.name !== "intro-bonus")
    .reduce((sum, b) => sum + b.value * (b.usage_ease || 0), 0);
}

/**
 * Calculate the usage-ease-adjusted intro bonus value.
 * This is a one-time benefit shown separately from annual value.
 */
export function calculateIntroBonusValue(benefits: Benefit[]): number {
  if (!benefits || benefits.length === 0) return 0;
  const introBonus = benefits.find((b) => b.name === "intro-bonus");
  if (!introBonus) return 0;
  return introBonus.value * (introBonus.usage_ease || 0);
}
