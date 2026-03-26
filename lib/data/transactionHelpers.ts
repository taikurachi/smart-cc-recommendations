import { Transaction, CreditCardOwned } from "../types";

export function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

export function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toFixed(2)}`;
}

export function formatCurrencyWithSign(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${formatCurrency(amount)}`;
}

export function getAmountColorClass(amount: number): string {
  return amount < 0 ? "text-red-600" : "text-green-600";
}

export function getTotalColorClass(total: number): string {
  return total < 0 ? "text-red-600" : "text-purple-900";
}

export function getTransactionsByAccountId(
  transactions: Transaction[],
  accountId: string,
): Transaction[] {
  return transactions.filter((t) => t.account_id === accountId);
}

export function getTransactionsByCreditCard(
  transactions: Transaction[],
  creditCard: CreditCardOwned,
): Transaction[] {
  return getTransactionsByAccountId(transactions, creditCard.account_id);
}

export function getTransactionsForCreditCards(
  transactions: Transaction[],
  creditCards: CreditCardOwned[],
): Transaction[] {
  const accountIds = new Set(creditCards.map((card) => card.account_id));
  return transactions.filter((t) => accountIds.has(t.account_id));
}

export function groupTransactionsByAccount(
  transactions: Transaction[],
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

export function groupTransactionsByCreditCard(
  transactions: Transaction[],
  currentlyOwnedCards: Record<string, string>[],
): Record<string, Transaction[]> {
  const cardMap: Record<string, string> = {};
  for (const card of currentlyOwnedCards) {
    cardMap[card.account_id] = card.name;
  }
  const accountIds = new Set(
    currentlyOwnedCards.map((card) => card.account_id),
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

export function removeDuplicateTransactions(
  transactions: Transaction[],
): Transaction[] {
  const seen = new Set<string>();
  const deduplicated: Transaction[] = [];

  for (const transaction of transactions) {
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
