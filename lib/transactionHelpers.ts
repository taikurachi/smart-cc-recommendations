import { Transaction, CreditCardOwned } from "./types";

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

/**
 * Filter transactions by a specific account_id
 */
export function getTransactionsByAccountId(
  transactions: Transaction[],
  accountId: string
): Transaction[] {
  return transactions.filter((t) => t.account_id === accountId);
}

/**
 * Filter transactions for a specific credit card (by account_id)
 */
export function getTransactionsByCreditCard(
  transactions: Transaction[],
  creditCard: CreditCardOwned
): Transaction[] {
  return getTransactionsByAccountId(transactions, creditCard.account_id);
}

/**
 * Get transactions for multiple credit cards
 */
export function getTransactionsForCreditCards(
  transactions: Transaction[],
  creditCards: CreditCardOwned[]
): Transaction[] {
  const accountIds = new Set(creditCards.map((card) => card.account_id));
  return transactions.filter((t) => accountIds.has(t.account_id));
}

/**
 * Group transactions by account_id
 * Returns a map where key is account_id and value is array of transactions
 */
export function groupTransactionsByAccount(
  transactions: Transaction[]
): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};
  transactions.forEach((transaction) => {
    const accountId = transaction.account_id;
    if (!grouped[accountId]) {
      grouped[accountId] = [];
    }
    grouped[accountId].push(transaction);
  });
  return grouped;
}

/**
 * Get transactions grouped by credit card
 * Returns a map where key is account_id and value is array of transactions
 * Only includes transactions that match one of the provided credit cards
 */
export function groupTransactionsByCreditCard(
  transactions: Transaction[],
  currentlyOwnedCards: Record<string, string>[]
): Record<string, Transaction[]> {
  const cardMap: Record<string, string> = {};
  for (const card of currentlyOwnedCards) {
    cardMap[card.account_id] = card.name;
  }
  const accountIds = new Set(
    currentlyOwnedCards.map((card) => card.account_id)
  );
  const grouped: Record<string, Transaction[]> = {};

  transactions.forEach((transaction) => {
    if (accountIds.has(transaction.account_id)) {
      const accountId = transaction.account_id;
      const cardName = cardMap[accountId];
      if (!grouped[cardName]) {
        grouped[cardName] = [];
      }
      grouped[cardName].push(transaction);
    }
  });
  return grouped;
}

/**
 * Removes duplicate transactions based on transaction_id
 * If duplicates are found, keeps the first occurrence
 * Returns the deduplicated array
 */
export function removeDuplicateTransactions(
  transactions: Transaction[]
): Transaction[] {
  const seen = new Set<string>();
  const deduplicated: Transaction[] = [];

  for (const transaction of transactions) {
    // Use transaction_id as the unique identifier
    // If transaction_id is missing, skip it (shouldn't happen with Plaid data)
    if (!transaction.transaction_id) {
      console.warn("Transaction missing transaction_id:", transaction);
      continue;
    }

    if (!seen.has(transaction.transaction_id)) {
      seen.add(transaction.transaction_id);
      deduplicated.push(transaction);
    }
  }

  return deduplicated;
}
