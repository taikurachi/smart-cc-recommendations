import { Credit } from "./types";

/**
 * Calculate the usage-ease-adjusted value of a card's credits.
 * Each credit's value is multiplied by its usage_ease (0 = unusable, 1 = fully usable).
 */
export function calculateCreditsValue(credits: Credit[]): number {
  if (!credits || credits.length === 0) return 0;
  return credits.reduce(
    (sum, credit) => sum + credit.value * (credit.usage_ease || 0),
    0
  );
}
