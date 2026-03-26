/**
 * Type definitions for the recommendation engine.
 * Covers credit card data shapes, reward structures, spending allocations,
 * and the composite value results returned by the engine.
 */

export type { Transaction, PersonalFinanceCategory } from "../types";

export interface RewardCap {
  quarterly?: number;
  annual?: number;
}

export interface Reward {
  rate: number;
  unit: "points" | "cash";
  cap?: RewardCap;
}

export interface Credit {
  name: string;
  value: number;
  usage_ease: number;
}

export interface Benefit {
  name: string;
  value: number;
  usage_ease: number;
}

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
  benefitsValue: number;
  introBonusValue: number;
  totalRewards: number;
  annualValue: number;
}

export interface MultiCardRecommendation {
  cards: CreditCardData[];
  combinedAnnualValue: number;
  combinedTotalRewards: number;
  combinedAnnualFees: number;
  allocation: SpendingAllocation[];
  message?: string;
}

export type CreditCardWithValue = CreditCardData & CardValueResult;

export interface RecommendationResult {
  cards: CreditCardWithValue[];
  message?: string;
}
