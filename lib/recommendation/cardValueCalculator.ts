import {
  CardValueResult,
  CategorySpending,
  CreditCardData,
  Transaction,
} from "./types";
import { calculateTransactionRewards } from "./rewardsCalculator";
import { calculateCreditsValue } from "./creditsCalculator";
import {
  calculateBenefitsValue,
  calculateIntroBonusValue,
} from "./benefitsCalculator";
import { computeAnnualCategorySpending } from "./utils";

function buildCardValueResult(
  card: CreditCardData,
  estimatedRewards: number,
  categorySpending?: CategorySpending,
): CardValueResult {
  const creditsValue = calculateCreditsValue(
    card.credits || [],
    categorySpending,
  );
  const benefitsValue = calculateBenefitsValue(
    card.benefits || [],
    categorySpending,
  );
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
 * Single source of truth for computing a card's annual value.
 * Composes transaction rewards + credits + benefits - annual fee.
 * Credits/benefits are now spending-aware: credit values are capped by
 * category spending and benefits gate on spending presence.
 * Intro bonus is returned separately (one-time, not part of annual value).
 */
export function calculateCardAnnualValue(
  card: CreditCardData,
  transactions: Transaction[],
): CardValueResult {
  const estimatedRewards = calculateTransactionRewards(card, transactions);
  const categorySpending = computeAnnualCategorySpending(transactions);
  return buildCardValueResult(card, estimatedRewards, categorySpending);
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
): CardValueResult {
  return buildCardValueResult(card, estimatedRewards, categorySpending);
}
