import { describe, it, expect } from "vitest";
import { calculateBenefitsValue, calculateIntroBonusValue } from "./benefitsCalculator";
import { Benefit } from "./types";

describe("benefitsCalculator", () => {
  const sampleBenefits: Benefit[] = [
    { name: "intro-bonus", value: 3000, usage_ease: 0.6 },
    { name: "travel-lounge", value: 850, usage_ease: 0.6 },
    { name: "travel-insurance", value: 200, usage_ease: 0.3 },
    { name: "purchase-protection", value: 50, usage_ease: 0.2 },
  ];

  it("excludes intro-bonus from benefits total", () => {
    expect(calculateBenefitsValue(sampleBenefits)).toBeCloseTo(580, 3);
  });

  it("empty array returns 0 for benefits", () => {
    expect(calculateBenefitsValue([])).toBeCloseTo(0, 3);
  });

  it("handles null/undefined gracefully for benefits", () => {
    // @ts-expect-error testing null
    expect(calculateBenefitsValue(null)).toBeCloseTo(0, 3);
  });

  it("benefits with only intro-bonus returns 0", () => {
    const onlyIntro: Benefit[] = [{ name: "intro-bonus", value: 500, usage_ease: 0.8 }];
    expect(calculateBenefitsValue(onlyIntro)).toBeCloseTo(0, 3);
  });

  it("benefits with no intro-bonus sums all", () => {
    const noBonusBenefits: Benefit[] = [
      { name: "lounge", value: 100, usage_ease: 1.0 },
      { name: "insurance", value: 50, usage_ease: 0.5 },
    ];
    expect(calculateBenefitsValue(noBonusBenefits)).toBeCloseTo(125, 3);
  });

  it("extracts intro-bonus with correct usage_ease", () => {
    expect(calculateIntroBonusValue(sampleBenefits)).toBeCloseTo(1800, 3);
  });

  it("returns 0 when no intro-bonus present", () => {
    const noBonusBenefits: Benefit[] = [
      { name: "lounge", value: 100, usage_ease: 1.0 },
    ];
    expect(calculateIntroBonusValue(noBonusBenefits)).toBeCloseTo(0, 3);
  });

  it("empty array returns 0 for intro bonus", () => {
    expect(calculateIntroBonusValue([])).toBeCloseTo(0, 3);
  });

  it("handles null/undefined gracefully for intro bonus", () => {
    // @ts-expect-error testing null
    expect(calculateIntroBonusValue(null)).toBeCloseTo(0, 3);
  });

  it("intro-bonus usage_ease 0 returns 0", () => {
    const zeroBonusBenefits: Benefit[] = [
      { name: "intro-bonus", value: 1000, usage_ease: 0 },
    ];
    expect(calculateIntroBonusValue(zeroBonusBenefits)).toBeCloseTo(0, 3);
  });
});
