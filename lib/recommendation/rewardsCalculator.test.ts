import { computeRewardValue, applyCap, calculateTransactionRewards } from "./rewardsCalculator";
import { CreditCardData, Reward, Transaction } from "./types";
import { createTestRunner, eq } from "./testUtils";

const { test, report } = createTestRunner();

// --- computeRewardValue ---

test("cash reward: 3% on $1000 = $30", () => {
  const reward: Reward = { rate: 0.03, unit: "cash" };
  eq(computeRewardValue(1000, reward), 30);
});

test("cash reward: 1% on $5000 = $50", () => {
  const reward: Reward = { rate: 0.01, unit: "cash" };
  eq(computeRewardValue(5000, reward), 50);
});

test("points reward: 5x on $1000 = $50", () => {
  // rate 0.05 => 0.05*100=5 points/dollar => 1000*5*0.01 = $50
  const reward: Reward = { rate: 0.05, unit: "points" };
  eq(computeRewardValue(1000, reward), 50);
});

test("points reward: 1x on $1000 = $10", () => {
  const reward: Reward = { rate: 0.01, unit: "points" };
  eq(computeRewardValue(1000, reward), 10);
});

test("points reward: 1.5x on $2000 = $30", () => {
  // rate 0.015 => 1.5 pts/dollar => 2000*1.5*0.01 = $30
  const reward: Reward = { rate: 0.015, unit: "points" };
  eq(computeRewardValue(2000, reward), 30);
});

test("zero spending returns 0", () => {
  eq(computeRewardValue(0, { rate: 0.05, unit: "points" }), 0);
});

// --- applyCap ---

test("no cap returns spending unchanged", () => {
  const reward: Reward = { rate: 0.03, unit: "cash" };
  eq(applyCap(15000, reward), 15000);
});

test("quarterly cap of $2500 limits annual to $10000", () => {
  const reward: Reward = { rate: 0.03, unit: "cash", cap: { quarterly: 2500 } };
  eq(applyCap(15000, reward), 10000);
});

test("quarterly cap does not reduce spending below cap", () => {
  const reward: Reward = { rate: 0.03, unit: "cash", cap: { quarterly: 2500 } };
  eq(applyCap(5000, reward), 5000);
});

test("annual cap limits spending", () => {
  const reward: Reward = { rate: 0.05, unit: "points", cap: { annual: 50000 } };
  eq(applyCap(60000, reward), 50000);
});

test("annual cap does not reduce spending below cap", () => {
  const reward: Reward = { rate: 0.05, unit: "points", cap: { annual: 50000 } };
  eq(applyCap(30000, reward), 30000);
});

// --- calculateTransactionRewards ---

function makeCard(overrides: Partial<CreditCardData>): CreditCardData {
  return {
    id: "test_card",
    name: "Test Card",
    institution_name: "Test Bank",
    annual_fee: 0,
    tags: [],
    rewards: {},
    credits: [],
    benefits: [],
    image: { src: "", alt: "" },
    ...overrides,
  };
}

function makeTx(overrides: Partial<Transaction> & { transaction_id: string; amount: number }): Transaction {
  return {
    account_id: "acc1",
    date: "2025-01-01",
    name: "Test",
    ...overrides,
  };
}

test("matches dining transaction to dining reward tier", () => {
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
  // $500 * 3% = $15
  eq(calculateTransactionRewards(card, txs), 15);
});

test("falls back to general when no specific tier matches", () => {
  const card = makeCard({
    rewards: { general: { rate: 0.015, unit: "points" } },
  });
  const txs: Transaction[] = [
    makeTx({
      transaction_id: "t1", amount: 1000,
      personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
    }),
  ];
  // No "dining" tier, falls back to general: 1000 * 1.5pts * $0.01 = $15
  eq(calculateTransactionRewards(card, txs), 15);
});

test("ignores negative-amount transactions (refunds)", () => {
  const card = makeCard({
    rewards: { dining: { rate: 0.03, unit: "cash" } },
  });
  const txs: Transaction[] = [
    makeTx({
      transaction_id: "t1", amount: -200,
      personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
    }),
  ];
  eq(calculateTransactionRewards(card, txs), 0);
});

test("applies cap to capped reward tier", () => {
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
  // Cap: 2500*4 = $10000 at 3% = $300. Remaining $5000 not on online-shopping tier.
  // But general gets $0 because the $15k was matched to online-shopping tier.
  // Only the capped $10000 is counted: 10000 * 0.03 = $300
  eq(calculateTransactionRewards(card, txs), 300);
});

test("card with no rewards returns 0", () => {
  const card = makeCard({ rewards: {} });
  const txs: Transaction[] = [
    makeTx({
      transaction_id: "t1", amount: 1000,
      personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
    }),
  ];
  eq(calculateTransactionRewards(card, txs), 0);
});

test("empty transactions return 0", () => {
  const card = makeCard({
    rewards: { dining: { rate: 0.05, unit: "points" } },
  });
  eq(calculateTransactionRewards(card, []), 0);
});

test("multiple categories aggregate correctly", () => {
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
  // dining: 500*0.03=15, grocery: 300*0.02=6, general: 200*0.01=2 => 23
  eq(calculateTransactionRewards(card, txs), 23);
});

report("rewardsCalculator.test.ts");
