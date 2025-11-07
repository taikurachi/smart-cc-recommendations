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
