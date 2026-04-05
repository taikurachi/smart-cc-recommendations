import type { CardPreferences, BenefitMultipliers } from "./types";

const KEYS = {
  USER_ID: "userId",
  CARD_PREFERENCES: "cardPreferences",
  CONNECTION_METHOD: "connectionMethod",
  BENEFIT_MULTIPLIERS: "benefitMultipliers",
} as const;

export function getStoredUserId(): string | null {
  return localStorage.getItem(KEYS.USER_ID);
}

export function setStoredUserId(userId: string): void {
  localStorage.setItem(KEYS.USER_ID, userId);
}

export function getStoredCardPreferences(): CardPreferences | null {
  const saved = localStorage.getItem(KEYS.CARD_PREFERENCES);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as CardPreferences;
  } catch {
    localStorage.removeItem(KEYS.CARD_PREFERENCES);
    return null;
  }
}

export function setStoredCardPreferences(prefs: CardPreferences): void {
  localStorage.setItem(KEYS.CARD_PREFERENCES, JSON.stringify(prefs));
}

export function setStoredConnectionMethod(method: string): void {
  localStorage.setItem(KEYS.CONNECTION_METHOD, method);
}

export function getStoredBenefitMultipliers(): BenefitMultipliers | null {
  const saved = localStorage.getItem(KEYS.BENEFIT_MULTIPLIERS);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as BenefitMultipliers;
  } catch {
    localStorage.removeItem(KEYS.BENEFIT_MULTIPLIERS);
    return null;
  }
}

export function setStoredBenefitMultipliers(
  multipliers: BenefitMultipliers,
): void {
  localStorage.setItem(KEYS.BENEFIT_MULTIPLIERS, JSON.stringify(multipliers));
}
