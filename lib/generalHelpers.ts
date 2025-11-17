import { loadCreditCardData } from "./creditCardData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedCardMap: Map<string, any> | null = null;

/**
 * Maps a card name (and optionally institution name) to an official card from manualcc.json
 * @param cardName - The name of the card (e.g., "Platinum Card", "Freedom Unlimited")
 * @param institutionName - Optional: The institution name (e.g., "American Express", "Chase")
 * @returns The matching card from manualcc.json, or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mapCardNameToOfficialCard(
  cardName: string,
  institutionName?: string
): Promise<any | null> {
  // Load credit cards from manualcc.json
  const cards = await loadCreditCardData();

  // Build a cache map for faster lookups
  if (!cachedCardMap) {
    cachedCardMap = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cards.forEach((card: any) => {
      // Create lookup keys: card name, institution + card name
      const nameKey = card.name?.toLowerCase().trim() || "";
      const fullKey = card.institution_name
        ? `${card.institution_name.toLowerCase().trim()}_${nameKey}`
        : nameKey;

      if (nameKey) {
        cachedCardMap!.set(nameKey, card);
      }
      if (fullKey && card.institution_name) {
        cachedCardMap!.set(fullKey, card);
      }
    });
  }

  // Normalize input
  const normalizedCardName = cardName?.toLowerCase().trim() || "";
  const normalizedInstitution = institutionName?.toLowerCase().trim() || "";

  // Try to find exact match
  if (normalizedInstitution && normalizedCardName) {
    const fullKey = `${normalizedInstitution}_${normalizedCardName}`;
    if (cachedCardMap.has(fullKey)) {
      return cachedCardMap.get(fullKey);
    }
  }

  // Try to find by card name only
  if (normalizedCardName && cachedCardMap.has(normalizedCardName)) {
    return cachedCardMap.get(normalizedCardName);
  }

  // Try fuzzy matching - check if card name contains the input or vice versa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const card of cards) {
    const cardNameLower = card.name?.toLowerCase().trim() || "";
    const institutionLower = card.institution_name?.toLowerCase().trim() || "";

    // Exact match on card name
    if (cardNameLower === normalizedCardName) {
      return card;
    }

    // Match if input contains card name or card name contains input
    if (
      normalizedCardName &&
      (cardNameLower.includes(normalizedCardName) ||
        normalizedCardName.includes(cardNameLower))
    ) {
      // If institution name provided, also check institution match
      if (
        !normalizedInstitution ||
        institutionLower === normalizedInstitution
      ) {
        return card;
      }
    }
  }

  return null;
}

/**
 * Calculate rewards estimates for a credit card (credits, benefits, intro bonus, etc.)
 * This calculates the non-transaction-based value of a card
 * @param card - The credit card object from manualcc.json
 * @returns Object containing totalRewards, annualValue, introBonusValue, creditsValue, benefitsValue
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRewardsEstimates(card: any): {
  totalRewards: number;
  annualValue: number;
  introBonusValue: number;
  creditsValue: number;
  benefitsValue: number;
} {
  // Calculate credits value
  const creditsValue = (card.credits || []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, credit: any) => {
      // usage_ease: 0 = hard (0% value), 1 = easy (100% value)
      const adjustedValue = credit.value * (credit.usage_ease || 0);
      return sum + adjustedValue;
    },
    0
  );

  // Calculate benefits value (excluding intro-bonus)
  const nonIntroBenefits = (card.benefits || []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b: any) => b.name !== "intro-bonus"
  );
  const benefitsValue = nonIntroBenefits.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, benefit: any) => {
      // usage_ease: 0 = hard (0% value), 1 = easy (100% value)
      const adjustedValue = benefit.value * (benefit.usage_ease || 0);
      return sum + adjustedValue;
    },
    0
  );

  // Calculate intro bonus value (display only, not included in annual value calculations)
  const introBonus = (card.benefits || []).find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b: any) => b.name === "intro-bonus"
  );
  const introBonusValue = introBonus
    ? introBonus.usage_ease * introBonus.value
    : 0;

  const annualFee = card.annual_fee || 0;

  // Total rewards = credits + benefits (excludes intro bonus - it's one-time)
  // Note: estimatedRewards should be added separately when calculating full annual value
  const totalRewards = creditsValue + benefitsValue;

  // Annual value = total rewards - annual fee (intro bonus excluded as it's a one-time benefit)
  const annualValue = totalRewards - annualFee;

  return {
    totalRewards,
    annualValue,
    introBonusValue,
    creditsValue,
    benefitsValue,
  };
}
