import { CreditCardData, Reward, Transaction } from "./types";
import { mapTransactionCategoryToRewardCategory } from "./categoryMapper";
import { isSpendingTransaction, getAnnualizationFactor } from "./utils";

/**
 * Cash-back-equivalent rate for a reward tier.
 * For points-based rewards with a known redemption multiplier (e.g. 1.5cpp
 * via transfer partners), `pointsMultiplier` adjusts the effective rate.
 */
export function getEffectiveRate(reward: Reward): number {
  if (reward.unit === "points" && reward.pointsMultiplier) {
    return reward.rate * reward.pointsMultiplier;
  }
  return reward.rate;
}

/**
 * Cash value produced by a single reward tier for a given spending amount.
 */
export function computeRewardValue(
  spending: number,
  reward: Reward,
): number {
  return spending * getEffectiveRate(reward);
}

/**
 * Apply quarterly or annual spending caps, returning the capped amount.
 * Used by the spending allocator where per-quarter transaction data
 * is unavailable (aggregated category totals).
 */
export function applyCap(spending: number, reward: Reward): number {
  if (!reward.cap) return spending;
  if (reward.cap.quarterly) {
    return Math.min(spending, reward.cap.quarterly * 4);
  }
  if (reward.cap.annual) {
    return Math.min(spending, reward.cap.annual);
  }
  return spending;
}

/**
 * Quarter-aware cap: group transactions by calendar quarter, cap each
 * quarter individually, then project to a full year based on how many
 * quarters of data we have.
 */
function calculateQuarterlyCappedSpending(
  transactions: Transaction[],
  quarterlyCap: number,
): number {
  const quarterBuckets: Record<string, number> = {};

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const q = Math.floor(date.getMonth() / 3) + 1;
    const key = `${date.getFullYear()}-Q${q}`;
    quarterBuckets[key] = (quarterBuckets[key] || 0) + Math.abs(t.amount);
  });

  const quarters = Object.values(quarterBuckets);
  if (quarters.length === 0) return 0;

  const totalCapped = quarters.reduce(
    (sum, spending) => sum + Math.min(spending, quarterlyCap),
    0,
  );

  return totalCapped * (4 / quarters.length);
}

/**
 * Compute the effective annual spending for a reward tier, handling:
 *   - quarterly caps (per-quarter bucketing, projected to 4 quarters)
 *   - annual caps (applied after annualization)
 *   - no cap (just annualize)
 */
function calculateEffectiveAnnualSpending(
  transactions: Transaction[],
  reward: Reward,
  annualizationFactor: number,
): number {
  if (reward.cap?.quarterly) {
    return calculateQuarterlyCappedSpending(transactions, reward.cap.quarterly);
  }

  const rawSpending = transactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const annualizedSpending = rawSpending * annualizationFactor;

  if (reward.cap?.annual) {
    return Math.min(annualizedSpending, reward.cap.annual);
  }

  return annualizedSpending;
}

/**
 * Calculate estimated annual transaction-based rewards for a credit card.
 *
 * Improvements over the naive approach:
 *   1. Filters out non-spending transactions (loan payments, transfers, etc.)
 *   2. Annualizes partial-year data so rewards are comparable to annual credits/benefits
 *   3. Applies quarterly caps per actual calendar quarter instead of quarterly×4
 *   4. Respects pointsMultiplier for transfer-partner valuations
 */
export function calculateTransactionRewards(
  card: CreditCardData,
  transactions: Transaction[],
): number {
  const spendingTxs = transactions.filter(isSpendingTransaction);

  const cardRewardCategories = new Set(
    card.rewards ? Object.keys(card.rewards) : [],
  );
  const hasGeneralCategory = cardRewardCategories.has("general");

  const categoryTxs: Record<string, Transaction[]> = {};

  spendingTxs.forEach((transaction) => {
    const rewardCategory = mapTransactionCategoryToRewardCategory(
      transaction.personal_finance_category,
    );

    let targetCategory: string | null = null;
    if (
      rewardCategory !== "general" &&
      cardRewardCategories.has(rewardCategory)
    ) {
      targetCategory = rewardCategory;
    } else if (hasGeneralCategory) {
      targetCategory = "general";
    }

    if (targetCategory) {
      if (!categoryTxs[targetCategory]) categoryTxs[targetCategory] = [];
      categoryTxs[targetCategory].push(transaction);
    }
  });

  const annualizationFactor = getAnnualizationFactor(spendingTxs);
  let totalRewards = 0;

  if (card.rewards) {
    Object.entries(card.rewards).forEach(([category, reward]) => {
      const txs = categoryTxs[category];
      if (!txs || txs.length === 0) return;

      const effectiveSpending = calculateEffectiveAnnualSpending(
        txs,
        reward,
        annualizationFactor,
      );
      totalRewards += computeRewardValue(effectiveSpending, reward);
    });
  }

  return totalRewards;
}
