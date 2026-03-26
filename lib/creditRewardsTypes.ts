/**
 * Canonical reward categories used by the recommendation engine.
 * These map to credit card reward tiers and Plaid transaction categories.
 */

export const rewardCategories = [
  "travel",
  "hotels",
  "gas",
  "grocery",
  "drugstores",
  "online-shopping",
  "dining",
  "wholesale-clubs",
  "general",
  "streaming",
  "transit",
  "entertainment",
] as const;

export type RewardCategory = (typeof rewardCategories)[number];
