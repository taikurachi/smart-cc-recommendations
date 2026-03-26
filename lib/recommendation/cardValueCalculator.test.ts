import { calculateCardAnnualValue, calculateCardAnnualValueFromRewards } from "./cardValueCalculator";
import { CreditCardData, Transaction } from "./types";
import { createTestRunner, eq } from "./testUtils";

const { test, report } = createTestRunner();

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
  eq(result.estimatedRewards, 30, "estimatedRewards");
  eq(result.creditsValue, 180, "creditsValue");
  eq(result.benefitsValue, 50, "benefitsValue");
  eq(result.introBonusValue, 400, "introBonusValue");
  eq(result.totalRewards, 260, "totalRewards");
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
  eq(result.creditsValue, 140);
  eq(result.benefitsValue, 60);
  eq(result.annualValue, 105);
});

test("fromRewards uses pre-calculated rewards correctly", () => {
  const card = makeCard({
    annual_fee: 50,
    credits: [{ name: "gas", value: 100, usage_ease: 0.5 }],
    benefits: [{ name: "purchase-protection", value: 40, usage_ease: 0.2 }],
  });
  const result = calculateCardAnnualValueFromRewards(card, 75);
  eq(result.estimatedRewards, 75);
  eq(result.creditsValue, 50);
  eq(result.benefitsValue, 8);
  eq(result.totalRewards, 133);
  eq(result.annualValue, 83);
});

report("cardValueCalculator.test.ts");
