import { allocateSpendingToCards, evaluateCardCombination } from "./spendingAllocator";
import { CreditCardData, Transaction } from "./types";

interface TestResult { name: string; passed: boolean; error?: string }
const tests: TestResult[] = [];

function test(name: string, fn: () => void) {
  try { fn(); tests.push({ name, passed: true }); }
  catch (e: any) { tests.push({ name, passed: false, error: e.message || String(e) }); }
}

function eq(actual: number, expected: number, label?: string) {
  if (Math.abs(actual - expected) > 0.01) {
    throw new Error(`${label || "Mismatch"}: got ${actual}, expected ${expected}`);
  }
}

function makeCard(overrides: Partial<CreditCardData>): CreditCardData {
  return {
    id: "card_default",
    name: "Default Card",
    institution_name: "Bank",
    annual_fee: 0,
    tags: [],
    rewards: {},
    credits: [],
    benefits: [],
    image: { src: "", alt: "" },
    ...overrides,
  };
}

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

test("allocates dining to highest-rate card", () => {
  const txs = [makeTx("t1", 600, "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT")];
  const alloc = allocateSpendingToCards([cardA, cardB], txs);

  const diningAlloc = alloc.find((a) => a.category === "dining");
  if (!diningAlloc) throw new Error("No dining allocation found");
  if (diningAlloc.cardId !== "card_a") {
    throw new Error(`Expected card_a for dining, got ${diningAlloc.cardId}`);
  }
  // cardA: 5x points = 5% effective rate > cardB: 2% cash
  eq(diningAlloc.rewardValue, 30); // 600 * 5pts * $0.01 = $30
});

test("allocates grocery to card with grocery tier", () => {
  const txs = [makeTx("t1", 400, "FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES")];
  const alloc = allocateSpendingToCards([cardA, cardB], txs);

  const groceryAlloc = alloc.find((a) => a.category === "grocery");
  if (!groceryAlloc) throw new Error("No grocery allocation found");
  if (groceryAlloc.cardId !== "card_b") {
    throw new Error(`Expected card_b for grocery, got ${groceryAlloc.cardId}`);
  }
  eq(groceryAlloc.rewardValue, 12); // 400 * 3% = $12
});

test("falls back to general when no specific tier", () => {
  const txs = [makeTx("t1", 1000, "RENT_AND_UTILITIES", "RENT_AND_UTILITIES_RENT")];
  const alloc = allocateSpendingToCards([cardA, cardB], txs);

  const generalAlloc = alloc.find((a) => a.category === "general");
  if (!generalAlloc) throw new Error("No general allocation found");
  // cardB has 1.5% general > cardA has 1% general
  if (generalAlloc.cardId !== "card_b") {
    throw new Error(`Expected card_b for general fallback, got ${generalAlloc.cardId}`);
  }
  eq(generalAlloc.rewardValue, 15); // 1000 * 1.5% = $15
});

test("cap overflow allocates remaining to next-best card", () => {
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

  // $15000 online shopping: cap = $2500*4 = $10000, overflow = $5000
  const txs = [makeTx("t1", 15000, "GENERAL_MERCHANDISE", "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES")];
  const alloc = allocateSpendingToCards([cappedCard, fallbackCard], txs);

  const cappedAlloc = alloc.find((a) => a.cardId === "capped");
  const overflowAlloc = alloc.find((a) => a.cardId === "fallback");

  if (!cappedAlloc) throw new Error("No capped card allocation");
  eq(cappedAlloc.amount, 10000, "capped amount");
  eq(cappedAlloc.rewardValue, 300, "capped reward"); // 10000 * 3% = $300

  if (!overflowAlloc) throw new Error("No overflow allocation");
  eq(overflowAlloc.amount, 5000, "overflow amount");
  eq(overflowAlloc.rewardValue, 75, "overflow reward"); // 5000 * 1.5% = $75
});

test("empty transactions produce empty allocation", () => {
  const alloc = allocateSpendingToCards([cardA, cardB], []);
  if (alloc.length !== 0) throw new Error(`Expected 0 allocations, got ${alloc.length}`);
});

test("negative amounts (refunds) are ignored", () => {
  const txs = [makeTx("t1", -500, "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT")];
  const alloc = allocateSpendingToCards([cardA, cardB], txs);
  if (alloc.length !== 0) throw new Error(`Expected 0 allocations for refunds, got ${alloc.length}`);
});

// --- evaluateCardCombination ---

test("evaluateCardCombination sums rewards + credits + benefits - fees", () => {
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

  // dining: card1 gets it (5% pts = 5%), 600*5*0.01=$30
  // grocery: card2 gets it (3% cash), 400*0.03=$12
  const expectedAllocRewards = 30 + 12;
  // credits: card1: 200*0.9=180, card2: 0
  const expectedCredits = 180;
  // benefits: card1: 100*0.5=50, card2: intro-bonus excluded=0
  const expectedBenefits = 50;
  const expectedTotalRewards = expectedAllocRewards + expectedCredits + expectedBenefits; // 42+180+50=272
  const expectedFees = 95 + 0;
  const expectedAnnualValue = expectedTotalRewards - expectedFees; // 272-95=177

  eq(result.totalRewards, expectedTotalRewards, "totalRewards");
  eq(result.totalFees, expectedFees, "totalFees");
  eq(result.totalAnnualValue, expectedAnnualValue, "totalAnnualValue");
});

// --- Report ---
console.log("\n--- spendingAllocator.test.ts ---\n");
let passed = 0, failed = 0;
tests.forEach((t) => {
  if (t.passed) { passed++; console.log(`  ✅ ${t.name}`); }
  else { failed++; console.log(`  ❌ ${t.name}: ${t.error}`); }
});
console.log(`\n  Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) process.exit(1);
