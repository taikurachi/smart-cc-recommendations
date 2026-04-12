/**
 * Type definitions for the recommendation engine.
 * Covers credit card data shapes, reward structures, spending allocations,
 * and the composite value results returned by the engine.
 */

export type { Transaction, PersonalFinanceCategory } from "../types";

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

export interface RewardCap {
  quarterly?: number;
  annual?: number;
}

export interface CreditCap {
  monthly?: number;
  quarterly?: number;
  annual?: number;
}

export interface Reward {
  rate: number;
  unit: "points" | "cash";
  cap?: RewardCap;
  pointsMultiplier?: number;
}

export const creditKinds = [
  "statement_credit",
  "travel_credit",
  "non_transactional",
] as const;

export type CreditKind = (typeof creditKinds)[number];

export interface Credit {
  name: string;
  value: number;
  usage_ease: number;
  kind?: CreditKind;
  category?: RewardCategory;
  cap?: CreditCap;
  match?: {
    keywords?: string[];
  };
}

export interface Benefit {
  name: string;
  value: number;
  usage_ease: number;
  category?: RewardCategory;
}

export type CategorySpending = Record<string, number>;

export interface CreditCardData {
  id: string;
  name: string;
  institution_name: string;
  annual_fee: number;
  tags: string[];
  rewards: Record<string, Reward>;
  credits: Credit[];
  benefits: Benefit[];
  image: {
    src: string;
    alt: string;
  };
}

export interface SpendingAllocation {
  cardId: string;
  cardName: string;
  category: string;
  amount: number;
  rewardRate: number;
  rewardValue: number;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface CardValueResult {
  estimatedRewards: number;
  creditsValue: number;
  creditBreakdowns: CreditValueBreakdown[];
  benefitsValue: number;
  introBonusValue: number;
  totalRewards: number;
  annualValue: number;
}

export interface CreditValueBreakdown {
  name: string;
  value: number;
  usageEase: number;
  category?: RewardCategory;
  matchedSpend: number | null;
  categorySpend: number | null;
  eligibleAmount: number;
  countedValue: number;
  source: "merchant_match" | "category_spend" | "usage_ease";
}

export interface OwnedCardRef {
  id?: string;
  name?: string;
  institution_name?: string;
}

export type CreditCardWithValue = CreditCardData &
  CardValueResult & {
    allocation?: SpendingAllocation[];
  };

export interface RecommendationResult {
  cards: CreditCardWithValue[];
  message?: string;
}

const TRAVEL_CREDIT_PATTERNS = [
  "travel credit",
  "travel-credit",
  "airline fee credit",
  "airline incidental credit",
  "hotel credit",
  "resort credit",
  "flight credit",
];

const NON_TRANSACTIONAL_CREDIT_PATTERNS = [
  "insurance",
  "protection",
  "warranty",
  "lounge",
  "elite status",
  "status",
  "concierge",
  "tsa precheck",
  "global entry",
  "clear",
  "anniversary",
  "free night",
];

function normalizeCreditName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function inferCreditKind(
  credit: Pick<Credit, "name" | "category" | "match">,
): CreditKind {
  const normalizedName = normalizeCreditName(credit.name);

  if (
    NON_TRANSACTIONAL_CREDIT_PATTERNS.some((pattern) =>
      normalizedName.includes(pattern),
    )
  ) {
    return "non_transactional";
  }

  if (
    TRAVEL_CREDIT_PATTERNS.some((pattern) => normalizedName.includes(pattern)) ||
    credit.category === "travel" ||
    credit.category === "hotels" ||
    credit.category === "transit"
  ) {
    return "travel_credit";
  }

  if (
    normalizedName.includes("credit") ||
    normalizedName.includes("statement") ||
    normalizedName.includes("reimbursement") ||
    Boolean(credit.match?.keywords?.length)
  ) {
    return "statement_credit";
  }

  return "non_transactional";
}

export function getCreditKind(credit: Credit): CreditKind {
  return credit.kind ?? inferCreditKind(credit);
}
