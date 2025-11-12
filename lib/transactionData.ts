/**
 * Load transaction data from transactions.json
 * Uses caching to avoid repeated fetches
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedTransactions: any[] | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<any[]> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadTransactionData(): Promise<any[]> {
  // Return cached data if available
  if (cachedTransactions) {
    return cachedTransactions;
  }

  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = fetch("/api/transactions")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load transaction data");
      }
      return response.json();
    })
    .then((data) => {
      // transactions.json is already an array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transactionsArray: any[] = Array.isArray(data) ? data : [];
      cachedTransactions = transactionsArray;
      return cachedTransactions;
    })
    .catch((error) => {
      console.error("Error loading transaction data:", error);
      loadingPromise = null; // Reset promise on error
      return [];
    });

  return loadingPromise;
}

/**
 * Clear the cache (useful for testing or if data needs to be refreshed)
 */
export function clearTransactionCache() {
  cachedTransactions = null;
  loadingPromise = null;
}
