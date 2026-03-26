import { getDb } from "../db";
import { creditCards as creditCardsTable } from "../../drizzle/schema";
import { CreditCardData } from "../recommendation/types";

let cachedCards: CreditCardData[] | null = null;
let loadingPromise: Promise<CreditCardData[]> | null = null;

export async function loadCreditCardData(): Promise<CreditCardData[]> {
  if (cachedCards) {
    return cachedCards;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  if (typeof window === "undefined" && typeof process !== "undefined") {
    const db = getDb();
    const rows = await db.select().from(creditCardsTable);
    cachedCards = rows as CreditCardData[];
    return cachedCards;
  }

  loadingPromise = fetch("/api/credit-cards")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load credit card data");
      }
      return response.json();
    })
    .then((data: CreditCardData[] | Record<string, CreditCardData>) => {
      const cardsArray: CreditCardData[] = Array.isArray(data)
        ? data
        : Object.values(data);
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
