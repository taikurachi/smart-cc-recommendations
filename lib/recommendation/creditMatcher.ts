import { getCreditKind, type Credit, type Transaction } from "./types";
import {
  enrichCreditMatchMetadata,
  normalizeCreditMatchKeywords,
} from "./creditMatchMetadata";

function normalizeTransactionName(name: string): string {
  return name.trim().toLowerCase();
}

function getCreditMatchKeywords(credit: Credit): string[] {
  if (getCreditKind(credit) !== "statement_credit") {
    return [];
  }

  const enrichedCredit = enrichCreditMatchMetadata(credit);
  return normalizeCreditMatchKeywords(enrichedCredit.match?.keywords);
}

function matchesKeyword(transactionName: string, keyword: string): boolean {
  return transactionName.includes(keyword);
}

export function getMatchedSpendForCredit(
  credit: Credit,
  transactions: Transaction[] = [],
): number {
  const keywords = getCreditMatchKeywords(credit);
  if (keywords.length === 0 || transactions.length === 0) {
    return 0;
  }

  return transactions.reduce((sum, transaction) => {
    const transactionName = normalizeTransactionName(transaction.name);
    if (keywords.some((keyword) => matchesKeyword(transactionName, keyword))) {
      return sum + Math.abs(transaction.amount);
    }

    return sum;
  }, 0);
}

export function getAnnualizedMatchedSpendForCredit(
  credit: Credit,
  transactions: Transaction[] = [],
): number | null {
  const keywords = getCreditMatchKeywords(credit);
  if (keywords.length === 0) {
    return null;
  }

  return getMatchedSpendForCredit(credit, transactions);
}
