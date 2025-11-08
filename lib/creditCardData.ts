/**
 * Load credit card data from cc.json
 * Uses caching to avoid repeated fetches
 */
let cachedCards: any[] | null = null;
let loadingPromise: Promise<any[]> | null = null;

export async function loadCreditCardData(): Promise<any[]> {
  // Return cached data if available
  if (cachedCards) {
    return cachedCards;
  }

  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = fetch("/api/credit-cards")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load credit card data");
      }
      return response.json();
    })
    .then((data) => {
      // Cache the credit cards array
      cachedCards = data.creditCards || [];
      return cachedCards;
    })
    .catch((error) => {
      console.error("Error loading credit card data:", error);
      loadingPromise = null; // Reset promise on error
      return [];
    });

  return loadingPromise;
}

/**
 * Clear the cache (useful for testing or if data needs to be refreshed)
 */
export function clearCreditCardCache() {
  cachedCards = null;
  loadingPromise = null;
}
