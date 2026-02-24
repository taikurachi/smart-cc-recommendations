import { CreditCardData } from "./types";

/**
 * Filter cards by user preferences. Tries strict match (all preferences) first,
 * falls back to partial match (any preference), then returns all cards if nothing matches.
 * Returns [filteredCards, message?].
 */
export function filterByPreferences(
  cards: CreditCardData[],
  preferences: Record<string, boolean>
): [CreditCardData[], string | undefined] {
  const preferencesArr = Object.entries(preferences)
    .filter(([, value]) => value)
    .map(([key]) => key);

  if (preferencesArr.length === 0) {
    return [cards, undefined];
  }

  let filtered = cards.filter((card) => {
    const tags = card.tags || [];
    return preferencesArr.every((pref) => tags.includes(pref));
  });

  if (filtered.length === 0) {
    filtered = cards.filter((card) => {
      const tags = card.tags || [];
      return preferencesArr.some((pref) => tags.includes(pref));
    });
  }

  if (filtered.length === 0) {
    return [
      cards,
      "There were no matches. Recommending you best value cards.",
    ];
  }

  return [filtered, undefined];
}

/**
 * Check if a card is already owned by the user (by ID or normalized name).
 */
export function isCardOwned(
  card: CreditCardData,
  ownedCards: Array<{ id?: string; name?: string }>
): boolean {
  if (!ownedCards || ownedCards.length === 0) return false;

  const normalize = (name: string) =>
    name?.replace(/[®™]/g, "").trim().toLowerCase() || "";

  return ownedCards.some((owned) => {
    if (card.id && owned.id && card.id === owned.id) return true;
    const cardName = normalize(card.name);
    const ownedName = normalize(owned.name || "");
    return cardName === ownedName && cardName !== "";
  });
}
