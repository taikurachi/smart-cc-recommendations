import { describe, it, expect } from "vitest";
import { calculateCardAnnualValue, calculateCardAnnualValueFromRewards } from "./cardValueCalculator";
import { Transaction } from "./types";
import { makeCard } from "./testFixtures";

describe("cardValueCalculator", () => {

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

  it("composes rewards + credits + benefits - fee correctly", () => {
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
    expect(result.estimatedRewards).toBeCloseTo(30, 3);
    expect(result.creditsValue).toBeCloseTo(180, 3);
    expect(result.benefitsValue).toBeCloseTo(50, 3);
    expect(result.introBonusValue).toBeCloseTo(400, 3);
    expect(result.totalRewards).toBeCloseTo(260, 3);
    expect(result.annualValue).toBeCloseTo(165, 3);
  });

  it("intro bonus is NOT included in annualValue", () => {
    const card = makeCard({
      annual_fee: 0,
      rewards: {},
      benefits: [{ name: "intro-bonus", value: 1000, usage_ease: 1.0 }],
    });
    const result = calculateCardAnnualValue(card, []);
    expect(result.introBonusValue).toBeCloseTo(1000, 3);
    expect(result.annualValue).toBeCloseTo(0, 3);
  });

  it("$0 fee card with no credits/benefits gives just rewards", () => {
    const card = makeCard({
      annual_fee: 0,
      rewards: { dining: { rate: 0.05, unit: "points" } },
    });
    const result = calculateCardAnnualValue(card, diningTx);
    expect(result.estimatedRewards).toBeCloseTo(50, 3);
    expect(result.creditsValue).toBeCloseTo(0, 3);
    expect(result.benefitsValue).toBeCloseTo(0, 3);
    expect(result.annualValue).toBeCloseTo(50, 3);
  });

  it("high fee card can produce negative annualValue", () => {
    const card = makeCard({
      annual_fee: 895,
      rewards: { general: { rate: 0.01, unit: "cash" } },
    });
    const result = calculateCardAnnualValue(card, diningTx);
    expect(result.annualValue).toBeCloseTo(-885, 3);
  });

  it("empty transactions with credits/benefits still works", () => {
    const card = makeCard({
      annual_fee: 95,
      credits: [{ name: "office", value: 200, usage_ease: 0.7 }],
      benefits: [{ name: "insurance", value: 150, usage_ease: 0.4 }],
    });
    const result = calculateCardAnnualValue(card, []);
    expect(result.estimatedRewards).toBeCloseTo(0, 3);
    expect(result.creditsValue).toBeCloseTo(140, 3);
    expect(result.benefitsValue).toBeCloseTo(60, 3);
    expect(result.annualValue).toBeCloseTo(105, 3);
  });

  it("fromRewards uses pre-calculated rewards correctly", () => {
    const card = makeCard({
      annual_fee: 50,
      credits: [{ name: "gas", value: 100, usage_ease: 0.5 }],
      benefits: [{ name: "purchase-protection", value: 40, usage_ease: 0.2 }],
    });
    const result = calculateCardAnnualValueFromRewards(card, 75);
    expect(result.estimatedRewards).toBeCloseTo(75, 3);
    expect(result.creditsValue).toBeCloseTo(50, 3);
    expect(result.benefitsValue).toBeCloseTo(8, 3);
    expect(result.totalRewards).toBeCloseTo(133, 3);
    expect(result.annualValue).toBeCloseTo(83, 3);
  });
});
