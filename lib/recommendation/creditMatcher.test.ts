import { describe, expect, it } from "vitest";
import { getAnnualizedMatchedSpendForCredit } from "./creditMatcher";
import { Credit, Transaction } from "./types";

function makeTransaction(
  overrides: Partial<Transaction> & {
    transaction_id: string;
    amount: number;
    name: string;
  },
): Transaction {
  return {
    account_id: "acc1",
    date: "2025-01-01",
    personal_finance_category: {
      primary: "GENERAL_MERCHANDISE",
      detailed: "GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE",
      confidence_level: "VERY_HIGH",
    },
    ...overrides,
  };
}

describe("creditMatcher", () => {
  it("normalizes merchant aliases before matching", () => {
    const credit: Credit = {
      name: "dunkin credit",
      value: 84,
      usage_ease: 1,
    };
    const transactions: Transaction[] = [
      makeTransaction({
        transaction_id: "t1",
        amount: 7,
        name: "SQ *DUNKIN DONUTS STORE 1234",
      }),
    ];

    expect(getAnnualizedMatchedSpendForCredit(credit, transactions)).toBeCloseTo(7, 3);
  });

  it("does not match merchant fragments inside unrelated names", () => {
    const credit: Credit = {
      name: "uber credit",
      value: 200,
      usage_ease: 1,
    };
    const transactions: Transaction[] = [
      makeTransaction({
        transaction_id: "t1",
        amount: 18,
        name: "Uber Trip Help.Uber.com",
      }),
      makeTransaction({
        transaction_id: "t2",
        amount: 42,
        name: "Uberall annual subscription",
      }),
    ];

    expect(getAnnualizedMatchedSpendForCredit(credit, transactions)).toBeCloseTo(18, 3);
  });

  it("avoids ambiguous merchants with boundary-aware token matching", () => {
    const credit: Credit = {
      name: "apple credit",
      value: 120,
      usage_ease: 1,
    };
    const transactions: Transaction[] = [
      makeTransaction({
        transaction_id: "t1",
        amount: 15,
        name: "APPLE.COM/BILL",
      }),
      makeTransaction({
        transaction_id: "t2",
        amount: 31,
        name: "Applebee's Neighborhood Grill",
      }),
    ];

    expect(getAnnualizedMatchedSpendForCredit(credit, transactions)).toBeCloseTo(15, 3);
  });

  it("supports inferred keywords after merchant normalization", () => {
    const credit: Credit = {
      name: "Saks Fifth Avenue credit",
      value: 100,
      usage_ease: 1,
    };
    const transactions: Transaction[] = [
      makeTransaction({
        transaction_id: "t1",
        amount: 50,
        name: "SAKS #0045 NEW YORK",
      }),
    ];

    expect(getAnnualizedMatchedSpendForCredit(credit, transactions)).toBeCloseTo(50, 3);
  });
});
