import { getDb } from "./db";
import { creditCards as creditCardsTable } from "../drizzle/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedCards: any[] | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<any[]> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadCreditCardData(): Promise<any[]> {
  if (cachedCards) {
    return cachedCards;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  if (typeof window === "undefined" && typeof process !== "undefined") {
    // Server-side: try DB first, then fall back to JSON file
    const db = getDb();
    if (db) {
      try {
        const rows = await db.select().from(creditCardsTable);
        if (rows.length > 0) {
          cachedCards = rows;
          loadingPromise = Promise.resolve(cachedCards);
          return loadingPromise;
        }
      } catch {
        // DB unavailable, fall through to file
      }
    }

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
    } catch {
      // Fall through to API fetch
    }
  }

  // Browser: fetch from API
  loadingPromise = fetch("/api/credit-cards")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load credit card data");
      }
      return response.json();
    })
    .then((data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cardsArray: any[] = Array.isArray(data) ? data : Object.values(data);
      cachedCards = cardsArray;
      return cachedCards;
    })
    .catch((error) => {
      console.error("Error loading credit card data:", error);
      loadingPromise = null;
      return [];
    });

  return loadingPromise;
}

export function clearCreditCardCache() {
  cachedCards = null;
  loadingPromise = null;
}
