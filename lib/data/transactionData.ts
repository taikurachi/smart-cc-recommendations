import { Transaction } from "../types";

let cachedTransactions: Transaction[] | null = null;
let loadingPromise: Promise<Transaction[]> | null = null;

export async function loadTransactionData(): Promise<Transaction[]> {
  if (cachedTransactions) {
    return cachedTransactions;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = fetch("/api/transactions")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load transaction data");
      }
      return response.json();
    })
    .then((data: Transaction[]) => {
      const transactionsArray: Transaction[] = Array.isArray(data) ? data : [];
      cachedTransactions = transactionsArray;
      return cachedTransactions;
    })
    .catch((error) => {
      console.error("Error loading transaction data:", error);
      loadingPromise = null;
      return [];
    });

  return loadingPromise;
}

export function clearTransactionCache() {
  cachedTransactions = null;
  loadingPromise = null;
}
