/**
 * App-wide type definitions for users, connections, transactions, and UI models.
 * Recommendation-engine-specific types live in lib/recommendation/types.ts.
 */

export interface User {
  id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  item_id: string;
  institution_name?: string;
  accounts: Array<{
    account_id: string;
    name: string;
    type: string;
    subtype: string;
    mask?: string;
  }>;
  created_at: string;
  last_synced?: string;
}

export interface PersonalFinanceCategory {
  primary: string;
  detailed: string;
  confidence_level: string;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category?: string[];
  personal_finance_category?: PersonalFinanceCategory;
}

export interface CreditCard {
  name: string;
  institution_name?: string;
  image: {
    src: string;
    alt: string;
  };
}

export interface CreditCardOwned extends CreditCard {
  account_id: string;
  credit_limit?: number;
  current_balance?: number;
  available_credit?: number;
  mask?: string;
}

export type CardPreference =
  | "travel"
  | "cashback"
  | "no_annual_fee"
  | "low_interest"
  | "beginner_friendly";

export interface CardPreferences {
  travel: boolean;
  cashback: boolean;
  no_annual_fee: boolean;
  low_interest: boolean;
  beginner_friendly: boolean;
}

export type BenefitMultipliers = Record<string, number>;

export interface SpendingAnalysis {
  totalSpending: number;
  annualizedSpending: number;
  dataSpanMonths: number;
  monthlyAverage: number;
  topCategory: {
    category: string;
    amount: number;
    percentage: number;
  };
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
  }>;
  recentTransactions: Transaction[];
}
