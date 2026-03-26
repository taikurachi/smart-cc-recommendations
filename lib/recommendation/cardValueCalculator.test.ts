import { calculateCardAnnualValue, calculateCardAnnualValueFromRewards } from "./cardValueCalculator";
import { CreditCardData, Transaction } from "./types";

interface TestResult { name: string; passed: boolean; error?: string }
const tests: TestResult[] = [];

function test(name: string, fn: () => void) {
  try { fn(); tests.push({ name, passed: true }); }
  catch (e: unknown) { tests.push({ name, passed: false, error: e instanceof Error ? e.message : String(e) }); }
}

function eq(actual: number, expected: number, label?: string) {
  if (Math.abs(actual - expected) > 0.01) {
    throw new Error(`${label || "Mismatch"}: got ${actual}, expected ${expected}`);
  }
}

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

const diningTx: Transaction[] = [
  {
    transaction_id: "t1",
    account_id: "acc1",
    amount: 1000,
    date: "2025-01-01",
    name: "Restaurant",
    personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
  },
];

test("composes rewards + credits + benefits - fee correctly", () => {
  const card = makeCard({
    annual_fee: 95,
    rewards: { dining: { rate: 0.03, unit: "cash" } },
    credits: [{ name: "uber", value: 200, usage_ease: 0.9 }],
    benefits: [
      { name: "travel-insurance", value: 100, usage_ease: 0.5 },
      { name: "intro-bonus", value: 500, usage_ease: 0.8 },
    ],
  });

  const result = calculateCardAnnualValue(card, diningTx);
  // rewards: 1000 * 0.03 = 30
  eq(result.estimatedRewards, 30, "estimatedRewards");
  // credits: 200 * 0.9 = 180
  eq(result.creditsValue, 180, "creditsValue");
  // benefits (excl intro): 100 * 0.5 = 50
  eq(result.benefitsValue, 50, "benefitsValue");
  // intro bonus: 500 * 0.8 = 400
  eq(result.introBonusValue, 400, "introBonusValue");
  // totalRewards: 30 + 180 + 50 = 260
  eq(result.totalRewards, 260, "totalRewards");
  // annualValue: 260 - 95 = 165
  eq(result.annualValue, 165, "annualValue");
});

test("intro bonus is NOT included in annualValue", () => {
  const card = makeCard({
    annual_fee: 0,
    rewards: {},
    benefits: [{ name: "intro-bonus", value: 1000, usage_ease: 1.0 }],
  });
  const result = calculateCardAnnualValue(card, []);
  eq(result.introBonusValue, 1000, "introBonusValue");
  eq(result.annualValue, 0, "annualValue should be 0 (intro bonus excluded)");
});

test("$0 fee card with no credits/benefits gives just rewards", () => {
  const card = makeCard({
    annual_fee: 0,
    rewards: { dining: { rate: 0.05, unit: "points" } },
  });
  const result = calculateCardAnnualValue(card, diningTx);
  // 1000 * 5pts * $0.01 = $50
  eq(result.estimatedRewards, 50);
  eq(result.creditsValue, 0);
  eq(result.benefitsValue, 0);
  eq(result.annualValue, 50);
});

test("high fee card can produce negative annualValue", () => {
  const card = makeCard({
    annual_fee: 895,
    rewards: { general: { rate: 0.01, unit: "cash" } },
  });
  const result = calculateCardAnnualValue(card, diningTx);
  // rewards: 1000 * 0.01 = $10
  // annualValue: 10 - 895 = -885
  eq(result.annualValue, -885);
});

test("empty transactions with credits/benefits still works", () => {
  const card = makeCard({
    annual_fee: 95,
    credits: [{ name: "office", value: 200, usage_ease: 0.7 }],
    benefits: [{ name: "insurance", value: 150, usage_ease: 0.4 }],
  });
  const result = calculateCardAnnualValue(card, []);
  eq(result.estimatedRewards, 0);
  // credits: 200*0.7=140, benefits: 150*0.4=60, total: 200, annual: 200-95=105
  eq(result.creditsValue, 140);
  eq(result.benefitsValue, 60);
  eq(result.annualValue, 105);
});

// --- calculateCardAnnualValueFromRewards ---

test("fromRewards uses pre-calculated rewards correctly", () => {
  const card = makeCard({
    annual_fee: 50,
    credits: [{ name: "gas", value: 100, usage_ease: 0.5 }],
    benefits: [{ name: "purchase-protection", value: 40, usage_ease: 0.2 }],
  });
  const result = calculateCardAnnualValueFromRewards(card, 75);
  // credits: 100*0.5=50, benefits: 40*0.2=8, total: 75+50+8=133, annual: 133-50=83
  eq(result.estimatedRewards, 75);
  eq(result.creditsValue, 50);
  eq(result.benefitsValue, 8);
  eq(result.totalRewards, 133);
  eq(result.annualValue, 83);
});

// --- Report ---
console.log("\n--- cardValueCalculator.test.ts ---\n");
let passed = 0, failed = 0;
tests.forEach((t) => {
  if (t.passed) { passed++; console.log(`  ✅ ${t.name}`); }
  else { failed++; console.log(`  ❌ ${t.name}: ${t.error}`); }
});
console.log(`\n  Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) process.exit(1);
