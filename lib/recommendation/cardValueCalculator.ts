import { CardValueResult, CreditCardData, Transaction } from "./types";
import { calculateTransactionRewards } from "./rewardsCalculator";
import { calculateCreditsValue } from "./creditsCalculator";
import {
  calculateBenefitsValue,
  calculateIntroBonusValue,
} from "./benefitsCalculator";

/**
 * Single source of truth for computing a card's annual value.
 * Composes transaction rewards + credits + benefits - annual fee.
 * Intro bonus is returned separately (one-time, not part of annual value).
 */
export function calculateCardAnnualValue(
  card: CreditCardData,
  transactions: Transaction[]
): CardValueResult {
  const estimatedRewards = calculateTransactionRewards(card, transactions);
  const creditsValue = calculateCreditsValue(card.credits || []);
  const benefitsValue = calculateBenefitsValue(card.benefits || []);
  const introBonusValue = calculateIntroBonusValue(card.benefits || []);
  const totalRewards = estimatedRewards + creditsValue + benefitsValue;
  const annualValue = totalRewards - (card.annual_fee || 0);

  return {
    estimatedRewards,
    creditsValue,
    benefitsValue,
    introBonusValue,
    totalRewards,
    annualValue,
  };
}

/**
 * Compute a card's annual value from pre-calculated transaction rewards
 * (used when rewards come from an allocation rather than full transaction list).
 */
export function calculateCardAnnualValueFromRewards(
  card: CreditCardData,
  estimatedRewards: number
): CardValueResult {
  const creditsValue = calculateCreditsValue(card.credits || []);
  const benefitsValue = calculateBenefitsValue(card.benefits || []);
  const introBonusValue = calculateIntroBonusValue(card.benefits || []);
  const totalRewards = estimatedRewards + creditsValue + benefitsValue;
  const annualValue = totalRewards - (card.annual_fee || 0);

  return {
    estimatedRewards,
    creditsValue,
    benefitsValue,
    introBonusValue,
    totalRewards,
    annualValue,
  };
}
