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

export interface Transaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category?: string[];
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

export interface CreditCardRecommendation extends CreditCard {
  rating: string;
  annualFee: string;
  rewards: string;
  introOffer?: string;
  matchScore: number;
  matchReasons: string[];
  estimatedValue?: number;
  annual_fee: number;
  estimatedRewards: number;
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

export type ConnectionMethod = "plaid" | "manual" | null;

export interface SpendingAnalysis {
  totalSpending: number;
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
