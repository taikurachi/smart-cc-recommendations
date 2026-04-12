import {
  CardValueResult,
  CategorySpending,
  CreditCardData,
  Transaction,
} from "./types";
import type { BenefitMultipliers } from "../types";
import { calculateTransactionRewards } from "./rewardsCalculator";
import {
  calculateCreditBreakdowns,
  calculateCreditsValue,
} from "./creditsCalculator";
import {
  calculateBenefitsValue,
  calculateIntroBonusValue,
} from "./benefitsCalculator";
import { computeAnnualCategorySpending } from "./utils";

function buildCardValueResult(
  card: CreditCardData,
  estimatedRewards: number,
  categorySpending?: CategorySpending,
  benefitMultipliers?: BenefitMultipliers,
  transactions: Transaction[] = [],
): CardValueResult {
  const creditBreakdowns = calculateCreditBreakdowns(
    card.credits || [],
    categorySpending,
    benefitMultipliers,
    transactions,
  );
  const creditsValue = calculateCreditsValue(
    card.credits || [],
    categorySpending,
    benefitMultipliers,
    transactions,
  );
  const benefitsValue = calculateBenefitsValue(
    card.benefits || [],
    categorySpending,
    benefitMultipliers,
  );
  const introBonusValue = calculateIntroBonusValue(card.benefits || []);
  const totalRewards = estimatedRewards + creditsValue + benefitsValue;
  const annualValue = totalRewards - (card.annual_fee || 0);
  return {
    estimatedRewards,
    creditsValue,
    creditBreakdowns,
    benefitsValue,
    introBonusValue,
    totalRewards,
    annualValue,
  };
}

/**
 * Single source of truth for computing a card's annual value.
 * Composes transaction rewards + credits + benefits - annual fee.
 * Credits/benefits are now spending-aware: credit values are capped by
 * category spending and benefits gate on spending presence.
 * Intro bonus is returned separately (one-time, not part of annual value).
 */
export function calculateCardAnnualValue(
  card: CreditCardData,
  transactions: Transaction[],
  benefitMultipliers?: BenefitMultipliers,
): CardValueResult {
  const estimatedRewards = calculateTransactionRewards(card, transactions);
  const categorySpending = computeAnnualCategorySpending(transactions);
  return buildCardValueResult(
    card,
    estimatedRewards,
    categorySpending,
    benefitMultipliers,
    transactions,
  );
}

/**
 * Compute a card's annual value from pre-calculated transaction rewards
 * (used when rewards come from an allocation rather than full transaction list).
 * Pass `categorySpending` to enable spending-aware credits/benefits.
 */
export function calculateCardAnnualValueFromRewards(
  card: CreditCardData,
  estimatedRewards: number,
  categorySpending?: CategorySpending,
  benefitMultipliers?: BenefitMultipliers,
  transactions: Transaction[] = [],
): CardValueResult {
  return buildCardValueResult(
    card,
    estimatedRewards,
    categorySpending,
    benefitMultipliers,
    transactions,
  );
}
