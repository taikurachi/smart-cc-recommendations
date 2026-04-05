import { describe, it, expect } from "vitest";
import { calculateBenefitsValue, calculateIntroBonusValue } from "./benefitsCalculator";
import { Benefit, CategorySpending } from "./types";

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

  describe("spending-aware (with categorySpending)", () => {
    it("zeroes benefit when category has no spending", () => {
      const benefits: Benefit[] = [
        { name: "travel-lounge", value: 850, usage_ease: 0.6, category: "travel" },
      ];
      const spending: CategorySpending = { dining: 5000 };
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(0, 3);
    });

    it("keeps benefit when category has spending", () => {
      const benefits: Benefit[] = [
        { name: "travel-lounge", value: 850, usage_ease: 0.6, category: "travel" },
      ];
      const spending: CategorySpending = { travel: 2000 };
      // 850 * 0.6 = 510
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(510, 3);
    });

    it("benefits without category are always included", () => {
      const benefits: Benefit[] = [
        { name: "purchase-protection", value: 100, usage_ease: 0.5 },
      ];
      const spending: CategorySpending = {};
      // no category → always valued: 100 * 0.5 = 50
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(50, 3);
    });

    it("mixes gated and ungated benefits correctly", () => {
      const benefits: Benefit[] = [
        { name: "travel-insurance", value: 200, usage_ease: 0.5, category: "travel" },
        { name: "purchase-protection", value: 100, usage_ease: 1.0 },
      ];
      const spending: CategorySpending = {};
      // travel: zeroed (no travel spending) → 0
      // purchase-protection: 100 * 1.0 = 100
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(100, 3);
    });

    it("backward compat: no categorySpending uses original behavior", () => {
      const benefits: Benefit[] = [
        { name: "travel-insurance", value: 200, usage_ease: 0.5, category: "travel" },
      ];
      // no categorySpending → 200 * 0.5 = 100
      expect(calculateBenefitsValue(benefits)).toBeCloseTo(100, 3);
    });

    it("intro-bonus is still excluded even with categorySpending", () => {
      const benefits: Benefit[] = [
        { name: "intro-bonus", value: 3000, usage_ease: 0.6 },
        { name: "lounge", value: 100, usage_ease: 1.0, category: "travel" },
      ];
      const spending: CategorySpending = { travel: 500 };
      // intro-bonus excluded, lounge: 100 * 1.0 = 100
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(100, 3);
    });
  });
});
