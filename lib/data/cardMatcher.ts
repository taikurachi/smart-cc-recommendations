import { CreditCardData } from "../recommendation/types";
import { loadCreditCardData } from "./creditCardData";

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Match a user-reported card name (e.g. from Plaid) to an official
 * CreditCardData entry. Tries exact-then-fuzzy matching on the card
 * name and institution name.
 *
 * When `cards` is omitted the full card catalog is loaded automatically.
 */
export async function mapCardNameToOfficialCard(
  cardName: string,
  institutionName?: string,
  cards?: CreditCardData[],
): Promise<CreditCardData | null> {
  const allCards = cards ?? (await loadCreditCardData());
  if (!cardName || allCards.length === 0) return null;

  const normalizedName = normalize(cardName);
  const normalizedInstitution = institutionName
    ? normalize(institutionName)
    : "";

  const exactMatch = allCards.find(
    (card) => normalize(card.name) === normalizedName,
  );
  if (exactMatch) return exactMatch;

  const containsMatch = allCards.find((card) => {
    const n = normalize(card.name);
    return n.includes(normalizedName) || normalizedName.includes(n);
  });
  if (containsMatch) return containsMatch;

  if (normalizedInstitution) {
    const institutionCandidates = allCards.filter((card) => {
      const cardInst = normalize(card.institution_name);
      return (
        cardInst.includes(normalizedInstitution) ||
        normalizedInstitution.includes(cardInst)
      );
    });

    if (institutionCandidates.length === 1) return institutionCandidates[0];

    const nameWords = normalizedName.split(/\s+/).filter(Boolean);
    const bestByWords = institutionCandidates.find((card) => {
      const cn = normalize(card.name);
      return nameWords.some((w) => w.length > 2 && cn.includes(w));
    });
    if (bestByWords) return bestByWords;
  }

  return null;
}
