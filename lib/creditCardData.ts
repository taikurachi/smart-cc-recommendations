/**
 * Load credit card data from manualcc.json
 * Uses caching to avoid repeated fetches
 * Converts the object format to an array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedCards: any[] | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<any[]> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // Check if we're in a test environment (Node.js, not browser)
  if (typeof window === "undefined" && typeof process !== "undefined") {
    // In Node.js environment (testing), load directly from file
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "data", "manualcc.json");
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(fileContents);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cardsArray: any[] = Object.values(data);
      cachedCards = cardsArray;
      loadingPromise = Promise.resolve(cachedCards);
      return loadingPromise;
    } catch (fileError) {
      // Fall through to API fetch if file read fails
    }
  }

  // In browser environment, use API
  loadingPromise = fetch("/api/credit-cards")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load credit card data");
      }
      return response.json();
    })
    .then((data) => {
      // Convert object format to array
      // manualcc.json is an object with card IDs as keys
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cardsArray: any[] = Object.values(data);
      cachedCards = cardsArray;
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
