import type { Credit } from "./types";

interface CreditMatchBackfillRule {
  keywords: string[];
  patterns: RegExp[];
}

const CREDIT_MATCH_BACKFILL_RULES: CreditMatchBackfillRule[] = [
  {
    keywords: ["uber"],
    patterns: [/\buber\b/i, /\buber cash\b/i, /\buber one\b/i],
  },
  {
    keywords: ["dunkin"],
    patterns: [/\bdunkin\b/i],
  },
  {
    keywords: ["lululemon"],
    patterns: [/\blululemon\b/i],
  },
  {
    keywords: ["doordash"],
    patterns: [/\bdoordash\b/i, /\bdashpass\b/i, /\bdoor[-\s]?dash\b/i],
  },
  {
    keywords: ["lyft"],
    patterns: [/\blyft\b/i],
  },
];

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

export function normalizeCreditMatchKeywords(keywords?: string[]): string[] {
  if (!Array.isArray(keywords)) return [];

  return [...new Set(keywords.map(normalizeKeyword).filter(Boolean))];
}

export function getBackfilledCreditMatchKeywords(name: string): string[] {
  for (const rule of CREDIT_MATCH_BACKFILL_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(name))) {
      return [...rule.keywords];
    }
  }

  return [];
}

export function enrichCreditMatchMetadata<T extends Credit>(credit: T): T {
  const existingKeywords = normalizeCreditMatchKeywords(credit.match?.keywords);
  const keywords =
    existingKeywords.length > 0
      ? existingKeywords
      : getBackfilledCreditMatchKeywords(credit.name);

  if (keywords.length === 0) {
    return credit;
  }

  return {
    ...credit,
    match: {
      ...credit.match,
      keywords,
    },
  };
}
