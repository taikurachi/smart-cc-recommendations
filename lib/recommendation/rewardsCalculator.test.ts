import { describe, it, expect } from "vitest";
import { computeRewardValue, applyCap, calculateTransactionRewards } from "./rewardsCalculator";
import { Reward, Transaction } from "./types";
import { makeCard, makeTx } from "./testFixtures";

describe("rewardsCalculator", () => {
  // --- computeRewardValue ---

  it("cash reward: 3% on $1000 = $30", () => {
    const reward: Reward = { rate: 0.03, unit: "cash" };
    expect(computeRewardValue(1000, reward)).toBeCloseTo(30, 3);
  });

  it("cash reward: 1% on $5000 = $50", () => {
    const reward: Reward = { rate: 0.01, unit: "cash" };
    expect(computeRewardValue(5000, reward)).toBeCloseTo(50, 3);
  });

  it("points reward: 5x on $1000 = $50", () => {
    const reward: Reward = { rate: 0.05, unit: "points" };
    expect(computeRewardValue(1000, reward)).toBeCloseTo(50, 3);
  });

  it("points reward: 1x on $1000 = $10", () => {
    const reward: Reward = { rate: 0.01, unit: "points" };
    expect(computeRewardValue(1000, reward)).toBeCloseTo(10, 3);
  });

  it("points reward: 1.5x on $2000 = $30", () => {
    const reward: Reward = { rate: 0.015, unit: "points" };
    expect(computeRewardValue(2000, reward)).toBeCloseTo(30, 3);
  });

  it("zero spending returns 0", () => {
    expect(computeRewardValue(0, { rate: 0.05, unit: "points" })).toBeCloseTo(0, 3);
  });

  // --- applyCap ---

  it("no cap returns spending unchanged", () => {
    const reward: Reward = { rate: 0.03, unit: "cash" };
    expect(applyCap(15000, reward)).toBeCloseTo(15000, 3);
  });

  it("quarterly cap of $2500 limits annual to $10000", () => {
    const reward: Reward = { rate: 0.03, unit: "cash", cap: { quarterly: 2500 } };
    expect(applyCap(15000, reward)).toBeCloseTo(10000, 3);
  });

  it("quarterly cap does not reduce spending below cap", () => {
    const reward: Reward = { rate: 0.03, unit: "cash", cap: { quarterly: 2500 } };
    expect(applyCap(5000, reward)).toBeCloseTo(5000, 3);
  });

  it("annual cap limits spending", () => {
    const reward: Reward = { rate: 0.05, unit: "points", cap: { annual: 50000 } };
    expect(applyCap(60000, reward)).toBeCloseTo(50000, 3);
  });

  it("annual cap does not reduce spending below cap", () => {
    const reward: Reward = { rate: 0.05, unit: "points", cap: { annual: 50000 } };
    expect(applyCap(30000, reward)).toBeCloseTo(30000, 3);
  });

  // --- calculateTransactionRewards ---

  it("matches dining transaction to dining reward tier", () => {
    const card = makeCard({
      rewards: {
        dining: { rate: 0.03, unit: "cash" },
        general: { rate: 0.01, unit: "cash" },
      },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 500,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(15, 3);
  });

  it("falls back to general when no specific tier matches", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.015, unit: "points" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 1000,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(15, 3);
  });

  it("ignores negative-amount transactions (refunds)", () => {
    const card = makeCard({
      rewards: { dining: { rate: 0.03, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: -200,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(0, 3);
  });

  it("applies cap to capped reward tier", () => {
    const card = makeCard({
      rewards: {
        "online-shopping": { rate: 0.03, unit: "cash", cap: { quarterly: 2500 } },
        general: { rate: 0.01, unit: "cash" },
      },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 15000,
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(300, 3);
  });

  it("card with no rewards returns 0", () => {
    const card = makeCard({ rewards: {} });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 1000,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(0, 3);
  });

  it("empty transactions return 0", () => {
    const card = makeCard({
      rewards: { dining: { rate: 0.05, unit: "points" } },
    });
    expect(calculateTransactionRewards(card, [])).toBeCloseTo(0, 3);
  });

  it("multiple categories aggregate correctly", () => {
    const card = makeCard({
      rewards: {
        dining: { rate: 0.03, unit: "cash" },
        grocery: { rate: 0.02, unit: "cash" },
        general: { rate: 0.01, unit: "cash" },
      },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 500,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 300,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t3", amount: 200,
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", confidence_level: "HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(23, 3);
  });
});
