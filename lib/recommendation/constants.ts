import type { RewardCategory } from "./types";

export const INTRO_BONUS_KEY = "intro-bonus" as const;

export const DEFAULT_REWARD_CATEGORY: RewardCategory = "general";

export const NON_SPENDING_PRIMARIES = new Set([
  "INCOME",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "LOAN_PAYMENTS",
  "BANK_FEES",
]);

export const MESSAGES = {
  ALL_OWNED:
    "All recommended cards are already owned. Your cards are optimized!",
  NO_COMBOS: "No suitable card combinations found.",
  OWNED_BETTER:
    "Your current cards already provide the best value. No better recommendations found.",
  NO_MATCHES: "There were no matches. Recommending you best value cards.",
} as const;
