import { loadCreditCardData } from "./creditCardData";
import { CreditCardData } from "./recommendation/types";

let cachedCardMap: Map<string, CreditCardData> | null = null;

/**
 * Maps a card name (and optionally institution name) to an official card.
 * Pass `providedCards` to skip the DB/API load (useful for tests).
 */
export async function mapCardNameToOfficialCard(
  cardName: string,
  institutionName?: string,
  providedCards?: CreditCardData[]
): Promise<CreditCardData | null> {
  const cards = providedCards ?? (await loadCreditCardData());

  if (!cachedCardMap) {
    cachedCardMap = new Map();
    cards.forEach((card) => {
      const nameKey = card.name?.toLowerCase().trim() || "";
      const fullKey = card.institution_name
        ? `${card.institution_name.toLowerCase().trim()}_${nameKey}`
        : nameKey;

      if (nameKey) cachedCardMap!.set(nameKey, card);
      if (fullKey && card.institution_name) cachedCardMap!.set(fullKey, card);
    });
  }

  const normalizedCardName = cardName?.toLowerCase().trim() || "";
  const normalizedInstitution = institutionName?.toLowerCase().trim() || "";

  if (normalizedInstitution && normalizedCardName) {
    const fullKey = `${normalizedInstitution}_${normalizedCardName}`;
    if (cachedCardMap.has(fullKey)) return cachedCardMap.get(fullKey)!;
  }

  if (normalizedCardName && cachedCardMap.has(normalizedCardName)) {
    return cachedCardMap.get(normalizedCardName)!;
  }

  for (const card of cards) {
    const cardNameLower = card.name?.toLowerCase().trim() || "";
    const institutionLower =
      card.institution_name?.toLowerCase().trim() || "";

    if (cardNameLower === normalizedCardName) return card;

    if (
      normalizedCardName &&
      (cardNameLower.includes(normalizedCardName) ||
        normalizedCardName.includes(cardNameLower))
    ) {
      if (!normalizedInstitution || institutionLower === normalizedInstitution) {
        return card;
      }
    }
  }

  return null;
}
