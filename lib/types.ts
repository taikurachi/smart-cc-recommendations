export interface User {
  id: string;
  email?: string;
  created_at: string;
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
  date: string;
  name: string;
  amount: number;
  category?: string[];
  [key: string]: any; // Allow additional properties from CSV or Plaid
}
