import { Credit, CreditCap, Transaction, getCreditKind } from "./types";
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
  "the",
  "travel",
  "wellness",
]);

const MERCHANT_NORMALIZATION_RULES: Array<[RegExp, string]> = [
  [/\bwal[\s-]*mart\b/g, "walmart"],
  [/\bdunkin(?:\s+donuts)?\b/g, "dunkin"],
  [/\bsaks\s+fifth\s+avenue\b/g, "saks"],
  [/\bthe\s+cheesecake\s+factory\b/g, "cheesecake factory"],
  [/\bgold\s+belly\b/g, "goldbelly"],
  [/\bgrub[\s-]*hub\b/g, "grubhub"],
  [/\bshake[\s-]*shack\b/g, "shake shack"],
  [/\buber[\s-]*eats\b/g, "uber eats"],
];

const TRANSACTION_NOISE_TOKENS = new Set([
  "com",
  "debit",
  "inc",
  "llc",
  "online",
  "order",
  "pos",
  "purchase",
  "store",
  "www",
]);

function applyMerchantNormalization(value: string): string {
  return MERCHANT_NORMALIZATION_RULES.reduce(
    (normalized, [pattern, replacement]) =>
      normalized.replace(pattern, replacement),
    value.toLowerCase(),
  );
}

function normalizeText(value: string): string {
  return applyMerchantNormalization(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizeNormalizedText(value: string, dropNoise = false): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];

  return normalized
    .split(" ")
    .filter((token) => token && !/^\d+$/.test(token))
    .filter((token) => !dropNoise || !TRANSACTION_NOISE_TOKENS.has(token));
}

function normalizeKeywords(keywords: string[]): string[] {
  return [
    ...new Set(
      keywords
        .map((keyword) => tokenizeNormalizedText(keyword).join(" "))
        .filter(Boolean),
    ),
  ];
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
  if (getCreditKind(credit) !== "statement_credit") {
    return [];
  }

  if (credit.match?.keywords?.length) {
    return normalizeKeywords(credit.match.keywords);
  }
  return inferMerchantKeywords(credit.name);
}

function matchesKeywordPhrase(
  transactionTokens: string[],
  keyword: string,
): boolean {
  const keywordTokens = keyword.split(" ").filter(Boolean);
  if (keywordTokens.length === 0) return false;

  if (keywordTokens.length === 1) {
    return transactionTokens.includes(keywordTokens[0]);
  }

  for (let i = 0; i <= transactionTokens.length - keywordTokens.length; i++) {
    let matches = true;

    for (let j = 0; j < keywordTokens.length; j++) {
      if (transactionTokens[i + j] !== keywordTokens[j]) {
        matches = false;
        break;
      }
    }

    if (matches) return true;
  }

  return false;
}

function getBucketKey(
  dateString: string,
  cadence: "monthly" | "quarterly",
): string | null {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  if (cadence === "monthly") {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }

  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

function calculateProjectedCappedSpend(
  transactions: Transaction[],
  cadence: "monthly" | "quarterly",
  cap: number,
): number {
  const periodsPerYear = cadence === "monthly" ? 12 : 4;
  const buckets: Record<string, number> = {};

  transactions.forEach((transaction) => {
    const bucketKey = getBucketKey(transaction.date, cadence);
    if (!bucketKey) return;

    buckets[bucketKey] = (buckets[bucketKey] || 0) + Math.abs(transaction.amount);
  });

  const observedPeriods = Object.values(buckets);
  if (observedPeriods.length === 0) return 0;

  const cappedSpend = observedPeriods.reduce(
    (sum, spend) => sum + Math.min(spend, cap),
    0,
  );

  return cappedSpend * (periodsPerYear / observedPeriods.length);
}

function applyCreditCaps(
  matchedTransactions: Transaction[],
  matchedSpend: number,
  cap?: CreditCap,
): number {
  if (!cap) return matchedSpend;

  let cappedSpend = matchedSpend;

  if (cap.monthly) {
    cappedSpend = calculateProjectedCappedSpend(
      matchedTransactions,
      "monthly",
      cap.monthly,
    );
  } else if (cap.quarterly) {
    cappedSpend = calculateProjectedCappedSpend(
      matchedTransactions,
      "quarterly",
      cap.quarterly,
    );
  }

  if (cap.annual) {
    cappedSpend = Math.min(cappedSpend, cap.annual);
  }

  return cappedSpend;
}

export function getAnnualizedMatchedSpendForCredit(
  credit: Credit,
  transactions: Transaction[],
): number | null {
  const keywords = getCreditMatchKeywords(credit);
  if (keywords.length === 0) return null;

  const spendingTransactions = transactions.filter(isSpendingTransaction);
  if (spendingTransactions.length === 0) return 0;

  const matchedTransactions = spendingTransactions.filter((transaction) => {
    const normalizedTokens = tokenizeNormalizedText(transaction.name || "", true);
    if (normalizedTokens.length === 0) return false;

    return keywords.some((keyword) =>
      matchesKeywordPhrase(normalizedTokens, keyword),
    );
  });
  if (matchedTransactions.length === 0) return 0;

  const annualizationFactor = getAnnualizationFactor(spendingTransactions);
  const matchedSpend =
    matchedTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0) *
    annualizationFactor;

  return applyCreditCaps(matchedTransactions, matchedSpend, credit.cap);
}
