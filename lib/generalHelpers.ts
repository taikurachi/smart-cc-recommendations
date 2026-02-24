import { loadCreditCardData } from "./creditCardData";
import { CreditCardData } from "./recommendation/types";
import { calculateCreditsValue } from "./recommendation/creditsCalculator";
import {
  calculateBenefitsValue,
  calculateIntroBonusValue,
} from "./recommendation/benefitsCalculator";

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
  const cards =
    providedCards ?? ((await loadCreditCardData()) as CreditCardData[]);

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

/**
 * Calculate non-transaction-based value of a card (credits + benefits).
 * Delegates to the focused calculator modules.
 */
export function getRewardsEstimates(card: CreditCardData): {
  totalRewards: number;
  annualValue: number;
  introBonusValue: number;
  creditsValue: number;
  benefitsValue: number;
} {
  const creditsValue = calculateCreditsValue(card.credits || []);
  const benefitsValue = calculateBenefitsValue(card.benefits || []);
  const introBonusValue = calculateIntroBonusValue(card.benefits || []);
  const totalRewards = creditsValue + benefitsValue;
  const annualValue = totalRewards - (card.annual_fee || 0);

  return {
    totalRewards,
    annualValue,
    introBonusValue,
    creditsValue,
    benefitsValue,
  };
}
