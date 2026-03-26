import type { CardPreferences } from "./types";

const KEYS = {
  USER_ID: "userId",
  CARD_PREFERENCES: "cardPreferences",
  CONNECTION_METHOD: "connectionMethod",
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
