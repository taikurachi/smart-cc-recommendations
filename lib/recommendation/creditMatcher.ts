import { Credit, Transaction } from "./types";
import { getAnnualizationFactor, isSpendingTransaction } from "./utils";

const CREDIT_MATCH_STOP_WORDS = new Set([
  "annual",
  "benefit",
  "benefits",
  "bill",
  "cash",
  "credit",
  "credits",
  "dining",
  "digital",
  "eligible",
  "entertainment",
  "fee",
  "fees",
  "general",
  "hotel",
  "hotels",
  "incidental",
  "monthly",
  "perk",
  "perks",
  "phone",
  "retail",
  "statement",
  "streaming",
  "subscription",
  "subscriptions",
  "travel",
  "wellness",
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeKeywords(keywords: string[]): string[] {
  return [...new Set(keywords.map(normalizeText).filter(Boolean))];
}

function inferMerchantKeywords(name: string): string[] {
  const normalizedName = normalizeText(name);
  const hasCreditMarker = /\b(benefit|benefits|credit|credits|perk|perks)\b/.test(
    normalizedName,
  );

  if (!hasCreditMarker) return [];

  const tokens = normalizedName
    .split(" ")
    .filter(
      (token) => token.length > 2 && !CREDIT_MATCH_STOP_WORDS.has(token),
    );

  if (tokens.length === 0) return [];
  return [tokens.join(" ")];
}

export function getCreditMatchKeywords(credit: Credit): string[] {
  if (credit.match?.keywords?.length) {
    return normalizeKeywords(credit.match.keywords);
  }
  return inferMerchantKeywords(credit.name);
}

export function getAnnualizedMatchedSpendForCredit(
  credit: Credit,
  transactions: Transaction[],
): number | null {
  const keywords = getCreditMatchKeywords(credit);
  if (keywords.length === 0) return null;

  const spendingTransactions = transactions.filter(isSpendingTransaction);
  if (spendingTransactions.length === 0) return 0;

  const annualizationFactor = getAnnualizationFactor(spendingTransactions);
  const matchedSpend = spendingTransactions.reduce((sum, transaction) => {
    const normalizedName = normalizeText(transaction.name || "");
    if (!normalizedName) return sum;

    const matchesKeyword = keywords.some((keyword) =>
      normalizedName.includes(keyword),
    );

    return matchesKeyword ? sum + Math.abs(transaction.amount) : sum;
  }, 0);

  return matchedSpend * annualizationFactor;
}
