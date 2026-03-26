import { describe, it, expect } from "vitest";
import { allocateSpendingToCards, evaluateCardCombination } from "./spendingAllocator";
import { Transaction } from "./types";
import { makeCard } from "./testFixtures";

describe("spendingAllocator", () => {
  function makeTx(id: string, amount: number, primary: string, detailed: string): Transaction {
    return {
      transaction_id: id,
      account_id: "acc1",
      amount,
      date: "2025-01-01",
      name: "Test",
      personal_finance_category: { primary, detailed, confidence_level: "VERY_HIGH" },
    };
  }

  const cardA = makeCard({
    id: "card_a",
    name: "Card A",
    rewards: {
      dining: { rate: 0.05, unit: "points" },
      general: { rate: 0.01, unit: "points" },
    },
  });

  const cardB = makeCard({
    id: "card_b",
    name: "Card B",
    rewards: {
      grocery: { rate: 0.03, unit: "cash" },
      dining: { rate: 0.02, unit: "cash" },
      general: { rate: 0.015, unit: "cash" },
    },
  });

  it("allocates dining to highest-rate card", () => {
    const txs = [makeTx("t1", 600, "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT")];
    const alloc = allocateSpendingToCards([cardA, cardB], txs);

    const diningAlloc = alloc.find((a) => a.category === "dining");
    expect(diningAlloc).toBeDefined();
    expect(diningAlloc!.cardId).toBe("card_a");
    expect(diningAlloc!.rewardValue).toBeCloseTo(30, 3);
  });

  it("allocates grocery to card with grocery tier", () => {
    const txs = [makeTx("t1", 400, "FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES")];
    const alloc = allocateSpendingToCards([cardA, cardB], txs);

    const groceryAlloc = alloc.find((a) => a.category === "grocery");
    expect(groceryAlloc).toBeDefined();
    expect(groceryAlloc!.cardId).toBe("card_b");
    expect(groceryAlloc!.rewardValue).toBeCloseTo(12, 3);
  });

  it("falls back to general when no specific tier", () => {
    const txs = [makeTx("t1", 1000, "RENT_AND_UTILITIES", "RENT_AND_UTILITIES_RENT")];
    const alloc = allocateSpendingToCards([cardA, cardB], txs);

    const generalAlloc = alloc.find((a) => a.category === "general");
    expect(generalAlloc).toBeDefined();
    expect(generalAlloc!.cardId).toBe("card_b");
    expect(generalAlloc!.rewardValue).toBeCloseTo(15, 3);
  });

  it("cap overflow allocates remaining to next-best card", () => {
    const cappedCard = makeCard({
      id: "capped",
      name: "Capped Card",
      rewards: {
        "online-shopping": { rate: 0.03, unit: "cash", cap: { quarterly: 2500 } },
      },
    });
    const fallbackCard = makeCard({
      id: "fallback",
      name: "Fallback Card",
      rewards: {
        general: { rate: 0.015, unit: "cash" },
      },
    });

    const txs = [makeTx("t1", 15000, "GENERAL_MERCHANDISE", "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES")];
    const alloc = allocateSpendingToCards([cappedCard, fallbackCard], txs);

    const cappedAlloc = alloc.find((a) => a.cardId === "capped");
    const overflowAlloc = alloc.find((a) => a.cardId === "fallback");

    expect(cappedAlloc).toBeDefined();
    expect(cappedAlloc!.amount).toBeCloseTo(10000, 3);
    expect(cappedAlloc!.rewardValue).toBeCloseTo(300, 3);

    expect(overflowAlloc).toBeDefined();
    expect(overflowAlloc!.amount).toBeCloseTo(5000, 3);
    expect(overflowAlloc!.rewardValue).toBeCloseTo(75, 3);
  });

  it("empty transactions produce empty allocation", () => {
    const alloc = allocateSpendingToCards([cardA, cardB], []);
    expect(alloc).toHaveLength(0);
  });

  it("negative amounts (refunds) are ignored", () => {
    const txs = [makeTx("t1", -500, "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT")];
    const alloc = allocateSpendingToCards([cardA, cardB], txs);
    expect(alloc).toHaveLength(0);
  });

  // --- evaluateCardCombination ---

  it("evaluateCardCombination sums rewards + credits + benefits - fees", () => {
    const card1 = makeCard({
      id: "card1",
      name: "Card 1",
      annual_fee: 95,
      rewards: { dining: { rate: 0.05, unit: "points" } },
      credits: [{ name: "uber", value: 200, usage_ease: 0.9 }],
      benefits: [{ name: "lounge", value: 100, usage_ease: 0.5 }],
    });
    const card2 = makeCard({
      id: "card2",
      name: "Card 2",
      annual_fee: 0,
      rewards: { grocery: { rate: 0.03, unit: "cash" } },
      credits: [],
      benefits: [{ name: "intro-bonus", value: 200, usage_ease: 1.0 }],
    });

    const txs = [
      makeTx("t1", 600, "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT"),
      makeTx("t2", 400, "FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES"),
    ];

    const result = evaluateCardCombination([card1, card2], txs);

    const expectedAllocRewards = 30 + 12;
    const expectedCredits = 180;
    const expectedBenefits = 50;
    const expectedTotalRewards = expectedAllocRewards + expectedCredits + expectedBenefits;
    const expectedFees = 95 + 0;
    const expectedAnnualValue = expectedTotalRewards - expectedFees;

    expect(result.totalRewards).toBeCloseTo(expectedTotalRewards, 3);
    expect(result.totalFees).toBeCloseTo(expectedFees, 3);
    expect(result.totalAnnualValue).toBeCloseTo(expectedAnnualValue, 3);
  });
});
