import { Transaction } from "./types";
import { DEFAULT_TRANSACTION_VALUES } from "./constants";

/**
 * Creates a new empty transaction with default values
 */
export function createNewTransaction(): Transaction {
  return {
    transaction_id: `csv_new_${Date.now()}`,
    account_id: DEFAULT_TRANSACTION_VALUES.ACCOUNT_ID,
    date: new Date().toISOString().split("T")[0],
    name: DEFAULT_TRANSACTION_VALUES.NEW_TRANSACTION_NAME,
    amount: DEFAULT_TRANSACTION_VALUES.NEW_TRANSACTION_AMOUNT,
  };
}

/**
 * Calculates the total amount from an array of transactions
 */
export function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Formats an amount as currency string
 */
export function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toFixed(2)}`;
}

/**
 * Formats an amount with sign
 */
export function formatCurrencyWithSign(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${formatCurrency(amount)}`;
}

/**
 * Gets the appropriate CSS class for an amount
 */
export function getAmountColorClass(amount: number): string {
  return amount < 0 ? "text-red-600" : "text-green-600";
}

/**
 * Gets the appropriate CSS class for a total
 */
export function getTotalColorClass(total: number): string {
  return total < 0 ? "text-red-600" : "text-purple-900";
}

