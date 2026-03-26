import { describe, it, expect } from "vitest";
import { getRecommendedCards, getMultiCardRecommendations } from "./index";
import { Transaction } from "./types";
import { makeCard, makeTx } from "./testFixtures";

const diningTx = makeTx({
  transaction_id: "t1",
  amount: 1000,
  personal_finance_category: {
    primary: "FOOD_AND_DRINK",
    detailed: "FOOD_AND_DRINK_RESTAURANT",
    confidence_level: "VERY_HIGH",
  },
});

const groceryTx = makeTx({
  transaction_id: "t2",
  amount: 800,
  personal_finance_category: {
    primary: "FOOD_AND_DRINK",
    detailed: "FOOD_AND_DRINK_GROCERIES",
    confidence_level: "VERY_HIGH",
  },
});

const generalTx = makeTx({
  transaction_id: "t3",
  amount: 500,
  personal_finance_category: {
    primary: "RENT_AND_UTILITIES",
    detailed: "RENT_AND_UTILITIES_RENT",
    confidence_level: "VERY_HIGH",
  },
});

const sampleTransactions: Transaction[] = [diningTx, groceryTx, generalTx];

const diningCard = makeCard({
  id: "dining_card",
  name: "Dining Card",
  annual_fee: 95,
  tags: ["dining"],
  rewards: {
    dining: { rate: 0.05, unit: "points" },
    general: { rate: 0.01, unit: "points" },
  },
  credits: [{ name: "uber", value: 200, usage_ease: 0.9 }],
  benefits: [{ name: "travel-insurance", value: 100, usage_ease: 0.5 }],
});

const groceryCard = makeCard({
  id: "grocery_card",
  name: "Grocery Card",
  annual_fee: 0,
  tags: ["cashback", "no_annual_fee"],
  rewards: {
    grocery: { rate: 0.03, unit: "cash" },
    general: { rate: 0.015, unit: "cash" },
  },
});

const generalCard = makeCard({
  id: "general_card",
  name: "General Card",
  annual_fee: 0,
  tags: ["cashback", "no_annual_fee"],
  rewards: {
    general: { rate: 0.02, unit: "cash" },
  },
});

const testCards = [diningCard, groceryCard, generalCard];

describe("getRecommendedCards", () => {
  it("returns cards sorted by annualValue descending", async () => {
    const result = await getRecommendedCards(sampleTransactions, {}, testCards);
    expect(result.cards.length).toBe(3);
    for (let i = 1; i < result.cards.length; i++) {
      expect(result.cards[i - 1].annualValue).toBeGreaterThanOrEqual(
        result.cards[i].annualValue,
      );
    }
  });

  it("filters by preferences (strict match)", async () => {
    const result = await getRecommendedCards(
      sampleTransactions,
      { cashback: true, no_annual_fee: true },
      testCards,
    );
    expect(result.cards.every((c) => c.tags.includes("cashback"))).toBe(true);
  });

  it("no preferences returns all cards", async () => {
    const result = await getRecommendedCards(sampleTransactions, {}, testCards);
    expect(result.cards.length).toBe(testCards.length);
    expect(result.message).toBeUndefined();
  });

  it("unmatched preferences falls back with message", async () => {
    const result = await getRecommendedCards(
      sampleTransactions,
      { premium: true },
      testCards,
    );
    expect(result.cards.length).toBe(testCards.length);
    expect(result.message).toBeDefined();
  });

  it("empty transactions still returns cards with value from credits/benefits", async () => {
    const result = await getRecommendedCards([], {}, testCards);
    expect(result.cards.length).toBe(testCards.length);
    const diningResult = result.cards.find((c) => c.id === "dining_card");
    expect(diningResult).toBeDefined();
    expect(diningResult!.creditsValue).toBeGreaterThan(0);
  });

  it("non-spending transactions do not inflate card rewards", async () => {
    const txsWithNonSpending: Transaction[] = [
      makeTx({
        transaction_id: "t1",
        amount: 500,
        personal_finance_category: {
          primary: "FOOD_AND_DRINK",
          detailed: "FOOD_AND_DRINK_RESTAURANT",
          confidence_level: "VERY_HIGH",
        },
      }),
      makeTx({
        transaction_id: "t2",
        amount: 10000,
        personal_finance_category: {
          primary: "LOAN_PAYMENTS",
          detailed: "LOAN_PAYMENTS_MORTGAGE_PAYMENT",
          confidence_level: "VERY_HIGH",
        },
      }),
    ];

    const resultWithNonSpending = await getRecommendedCards(
      txsWithNonSpending,
      {},
      testCards,
    );

    const txsSpendingOnly: Transaction[] = [
      makeTx({
        transaction_id: "t1",
        amount: 500,
        personal_finance_category: {
          primary: "FOOD_AND_DRINK",
          detailed: "FOOD_AND_DRINK_RESTAURANT",
          confidence_level: "VERY_HIGH",
        },
      }),
    ];

    const resultSpendingOnly = await getRecommendedCards(
      txsSpendingOnly,
      {},
      testCards,
    );

    const cardA = resultWithNonSpending.cards.find(
      (c) => c.id === "general_card",
    );
    const cardB = resultSpendingOnly.cards.find(
      (c) => c.id === "general_card",
    );
    expect(cardA!.estimatedRewards).toBeCloseTo(cardB!.estimatedRewards, 3);
  });
});

describe("getMultiCardRecommendations", () => {
  it("returns a 2-3 card combination", async () => {
    const result = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      [],
      undefined,
      testCards,
    );
    expect(result.cards.length).toBeGreaterThanOrEqual(2);
    expect(result.cards.length).toBeLessThanOrEqual(3);
  });

  it("excludes owned cards from recommendations", async () => {
    const ownedCards = [{ id: "dining_card", name: "Dining Card" }];
    const result = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      ownedCards,
      undefined,
      testCards,
    );
    expect(result.cards.every((c) => c.id !== "dining_card")).toBe(true);
  });

  it("returns empty when all cards are owned", async () => {
    const ownedCards = testCards.map((c) => ({ id: c.id, name: c.name }));
    const result = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      ownedCards,
      undefined,
      testCards,
    );
    expect(result.cards.length).toBe(0);
    expect(result.message).toContain("already owned");
  });

  it("prefers owned cards when their value exceeds recommendation", async () => {
    const result = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      [{ id: "external", name: "External Card" }],
      999999,
      testCards,
    );
    expect(result.cards.length).toBe(0);
    expect(result.message).toContain("best value");
  });

  it("respects preferences", async () => {
    const result = await getMultiCardRecommendations(
      sampleTransactions,
      { cashback: true, no_annual_fee: true },
      [],
      undefined,
      testCards,
    );
    expect(result.cards.length).toBeGreaterThan(0);
  });

  it("single available card falls back to single-card evaluation", async () => {
    const result = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      [
        { id: "dining_card", name: "Dining Card" },
        { id: "grocery_card", name: "Grocery Card" },
      ],
      0,
      testCards,
    );
    expect(result.cards.length).toBe(1);
    expect(result.cards[0].id).toBe("general_card");
  });

  it("single-card fallback picks the BEST card, not first", async () => {
    const weakCard = makeCard({
      id: "weak",
      name: "Weak Card",
      annual_fee: 0,
      rewards: { general: { rate: 0.005, unit: "cash" } },
    });
    const strongCard = makeCard({
      id: "strong",
      name: "Strong Card",
      annual_fee: 0,
      rewards: { general: { rate: 0.03, unit: "cash" } },
    });

    const result = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      [],
      0,
      [weakCard, strongCard],
    );
    expect(result.cards.length).toBe(2);

    const resultSingle = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      [{ id: "weak", name: "Weak Card" }],
      0,
      [weakCard, strongCard],
    );
    expect(resultSingle.cards.length).toBe(1);
    expect(resultSingle.cards[0].id).toBe("strong");
  });

  it("empty transactions returns cards ranked by credits/benefits", async () => {
    const result = await getMultiCardRecommendations(
      [],
      {},
      [],
      undefined,
      testCards,
    );
    expect(result.cards.length).toBeGreaterThan(0);
    const topCard = result.cards[0];
    expect(topCard.estimatedRewards).toBeCloseTo(0, 3);
    expect(topCard.creditsValue + topCard.benefitsValue).toBeGreaterThanOrEqual(0);
  });

  it("all cards identical returns valid combo", async () => {
    const identicalCards = [
      makeCard({ id: "a", name: "Card A", rewards: { general: { rate: 0.02, unit: "cash" } } }),
      makeCard({ id: "b", name: "Card B", rewards: { general: { rate: 0.02, unit: "cash" } } }),
      makeCard({ id: "c", name: "Card C", rewards: { general: { rate: 0.02, unit: "cash" } } }),
    ];

    const result = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      [],
      undefined,
      identicalCards,
    );
    expect(result.cards.length).toBeGreaterThanOrEqual(2);
  });

  it("non-spending transactions excluded from multi-card evaluation", async () => {
    const txsWithLoan: Transaction[] = [
      ...sampleTransactions,
      makeTx({
        transaction_id: "loan",
        amount: 50000,
        personal_finance_category: {
          primary: "LOAN_PAYMENTS",
          detailed: "LOAN_PAYMENTS_MORTGAGE_PAYMENT",
          confidence_level: "VERY_HIGH",
        },
      }),
    ];

    const resultWithLoan = await getMultiCardRecommendations(
      txsWithLoan,
      {},
      [],
      undefined,
      testCards,
    );

    const resultWithout = await getMultiCardRecommendations(
      sampleTransactions,
      {},
      [],
      undefined,
      testCards,
    );

    const totalWithLoan = resultWithLoan.cards.reduce(
      (sum, c) => sum + c.annualValue,
      0,
    );
    const totalWithout = resultWithout.cards.reduce(
      (sum, c) => sum + c.annualValue,
      0,
    );
    expect(totalWithLoan).toBeCloseTo(totalWithout, 0);
  });
});
