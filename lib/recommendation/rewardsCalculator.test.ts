import { describe, it, expect } from "vitest";
import { computeRewardValue, applyCap, calculateTransactionRewards, getEffectiveRate } from "./rewardsCalculator";
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

  // --- getEffectiveRate with pointsMultiplier ---

  it("pointsMultiplier scales rate for points rewards", () => {
    const reward: Reward = { rate: 0.05, unit: "points", pointsMultiplier: 1.5 };
    expect(getEffectiveRate(reward)).toBeCloseTo(0.075, 6);
  });

  it("pointsMultiplier ignored for cash rewards", () => {
    const reward: Reward = { rate: 0.03, unit: "cash", pointsMultiplier: 2.0 };
    expect(getEffectiveRate(reward)).toBeCloseTo(0.03, 6);
  });

  it("no pointsMultiplier returns rate as-is", () => {
    const reward: Reward = { rate: 0.05, unit: "points" };
    expect(getEffectiveRate(reward)).toBeCloseTo(0.05, 6);
  });

  it("computeRewardValue applies pointsMultiplier", () => {
    const reward: Reward = { rate: 0.05, unit: "points", pointsMultiplier: 1.5 };
    expect(computeRewardValue(1000, reward)).toBeCloseTo(75, 3);
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

  it("both quarterly and annual cap: quarterly takes precedence", () => {
    const reward: Reward = {
      rate: 0.03,
      unit: "cash",
      cap: { quarterly: 1000, annual: 20000 },
    };
    expect(applyCap(15000, reward)).toBeCloseTo(4000, 3);
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

  // --- Non-spending transaction filtering ---

  it("excludes LOAN_PAYMENTS from reward calculation", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.02, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 2000,
        personal_finance_category: { primary: "LOAN_PAYMENTS", detailed: "LOAN_PAYMENTS_MORTGAGE_PAYMENT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 500,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(10, 3);
  });

  it("excludes TRANSFER_OUT from reward calculation", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.02, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 5000,
        personal_finance_category: { primary: "TRANSFER_OUT", detailed: "TRANSFER_OUT_ACCOUNT_TRANSFER", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(0, 3);
  });

  it("excludes INCOME from reward calculation", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.02, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 3000,
        personal_finance_category: { primary: "INCOME", detailed: "INCOME_WAGES", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(0, 3);
  });

  it("excludes BANK_FEES from reward calculation", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.02, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 35,
        personal_finance_category: { primary: "BANK_FEES", detailed: "BANK_FEES_ATM_FEES", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 100,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(2, 3);
  });

  it("excludes TRANSFER_IN from reward calculation", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.02, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 1000,
        personal_finance_category: { primary: "TRANSFER_IN", detailed: "TRANSFER_IN_DEPOSIT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(0, 3);
  });

  it("non-spending mixed with real spending only counts spending", () => {
    const card = makeCard({
      rewards: {
        dining: { rate: 0.03, unit: "cash" },
        general: { rate: 0.01, unit: "cash" },
      },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 2000,
        personal_finance_category: { primary: "LOAN_PAYMENTS", detailed: "LOAN_PAYMENTS_MORTGAGE_PAYMENT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 1500,
        personal_finance_category: { primary: "TRANSFER_OUT", detailed: "TRANSFER_OUT_ACCOUNT_TRANSFER", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t3", amount: 500,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t4", amount: 200,
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", confidence_level: "HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(500 * 0.03 + 200 * 0.01, 3);
  });

  // --- Annualization ---

  it("annualizes 6 months of data to full year", () => {
    const card = makeCard({
      rewards: { dining: { rate: 0.03, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 500, date: "2025-01-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 500, date: "2025-07-14",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    const spanDays = (new Date("2025-07-14").getTime() - new Date("2025-01-15").getTime()) / (1000 * 60 * 60 * 24);
    const factor = 365 / spanDays;
    const annualizedSpending = 1000 * factor;
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(annualizedSpending * 0.03, 1);
  });

  it("annualizes 3 months of data to full year", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.02, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 300, date: "2025-01-01",
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_OTHER", confidence_level: "HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 300, date: "2025-04-01",
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_OTHER", confidence_level: "HIGH" },
      }),
    ];
    const spanDays = 90;
    const factor = 365 / spanDays;
    const annualizedSpending = 600 * factor;
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(annualizedSpending * 0.02, 1);
  });

  it("12 months of data has factor ~1 (no over-scaling)", () => {
    const card = makeCard({
      rewards: { dining: { rate: 0.03, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 500, date: "2025-01-01",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 500, date: "2025-12-31",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    const rewards = calculateTransactionRewards(card, txs);
    expect(rewards).toBeCloseTo(1000 * 0.03, 0);
  });

  it("does not annualize when span < 30 days", () => {
    const card = makeCard({
      rewards: { dining: { rate: 0.03, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 200, date: "2025-01-01",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 300, date: "2025-01-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(500 * 0.03, 3);
  });

  it("single transaction (1 day span) does not annualize", () => {
    const card = makeCard({
      rewards: { dining: { rate: 0.03, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 100, date: "2025-06-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(3, 3);
  });

  // --- Quarterly cap with per-quarter bucketing ---

  it("quarterly cap applied per quarter with uneven spending", () => {
    const card = makeCard({
      rewards: {
        dining: { rate: 0.05, unit: "cash", cap: { quarterly: 1500 } },
      },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 3000, date: "2025-01-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 500, date: "2025-04-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    // Q1: min(3000, 1500) = 1500 capped, Q2: min(500, 1500) = 500 under cap
    // 2 quarters of data → project to 4: (1500 + 500) * (4/2) = 4000
    // Reward: 4000 * 0.05 = 200
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(200, 1);
  });

  it("quarterly cap with even spending across 4 quarters", () => {
    const card = makeCard({
      rewards: {
        dining: { rate: 0.05, unit: "cash", cap: { quarterly: 1500 } },
      },
    });
    const txs: Transaction[] = [
      makeTx({ transaction_id: "t1", amount: 2000, date: "2025-01-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" } }),
      makeTx({ transaction_id: "t2", amount: 2000, date: "2025-04-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" } }),
      makeTx({ transaction_id: "t3", amount: 2000, date: "2025-07-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" } }),
      makeTx({ transaction_id: "t4", amount: 2000, date: "2025-10-15",
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" } }),
    ];
    // Each quarter: min(2000, 1500) = 1500, 4 quarters → 6000, factor 4/4 = 1 → 6000
    // Reward: 6000 * 0.05 = 300
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(300, 1);
  });

  // --- Card with specific tiers but no general ---

  it("card without general tier ignores unmapped category spending", () => {
    const card = makeCard({
      rewards: {
        dining: { rate: 0.05, unit: "cash" },
      },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 500,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 1000,
        personal_finance_category: { primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_RENT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(25, 3);
  });

  it("card with only general tier earns on all spending", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.015, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 500,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 300,
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      }),
      makeTx({
        transaction_id: "t3", amount: 200,
        personal_finance_category: { primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_RENT", confidence_level: "HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(1000 * 0.015, 3);
  });

  // --- Edge cases ---

  it("zero-amount transaction is ignored", () => {
    const card = makeCard({
      rewards: { dining: { rate: 0.03, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 0,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(0, 3);
  });

  it("micro-transaction ($0.01) is counted", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.02, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 0.01,
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_OTHER", confidence_level: "HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(0.0002, 6);
  });

  it("transaction without personal_finance_category falls back to general", () => {
    const card = makeCard({
      rewards: { general: { rate: 0.01, unit: "cash" } },
    });
    const txs: Transaction[] = [
      makeTx({ transaction_id: "t1", amount: 100 }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(1, 3);
  });

  it("annual cap hit exactly at boundary", () => {
    const card = makeCard({
      rewards: {
        general: { rate: 0.02, unit: "cash", cap: { annual: 10000 } },
      },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 10000,
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_OTHER", confidence_level: "HIGH" },
      }),
    ];
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(200, 3);
  });

  it("annual cap with annualization: 6-month data exceeds annual cap", () => {
    const card = makeCard({
      rewards: {
        general: { rate: 0.02, unit: "cash", cap: { annual: 15000 } },
      },
    });
    const txs: Transaction[] = [
      makeTx({
        transaction_id: "t1", amount: 5000, date: "2025-01-01",
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_OTHER", confidence_level: "HIGH" },
      }),
      makeTx({
        transaction_id: "t2", amount: 5000, date: "2025-07-01",
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_OTHER", confidence_level: "HIGH" },
      }),
    ];
    // 6-month span ≈ 181 days, factor ≈ 2.017
    // Annualized: ~10000 * 2.017 ≈ 20166, capped at 15000
    // Reward: 15000 * 0.02 = 300
    expect(calculateTransactionRewards(card, txs)).toBeCloseTo(300, 0);
  });
});
