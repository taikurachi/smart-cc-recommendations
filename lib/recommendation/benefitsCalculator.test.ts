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

    it("keeps full benefit when category spending exceeds value", () => {
      const benefits: Benefit[] = [
        { name: "travel-lounge", value: 850, usage_ease: 0.6, category: "travel" },
      ];
      const spending: CategorySpending = { travel: 2000 };
      // min(850, 2000) * 0.6 = 510
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(510, 3);
    });

    it("caps benefit value by category spending when spending is lower", () => {
      const benefits: Benefit[] = [
        { name: "trip-cancellation", value: 1500, usage_ease: 0.5, category: "travel" },
      ];
      const spending: CategorySpending = { travel: 500 };
      // min(1500, 500) * 0.5 = 250
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(250, 3);
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
      // intro-bonus excluded, lounge: min(100, 500) * 1.0 = 100
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(100, 3);
    });

    it("caps multiple categorized benefits independently", () => {
      const benefits: Benefit[] = [
        { name: "cell-phone-protection", value: 800, usage_ease: 0.6, category: "streaming" },
        { name: "trip-cancellation", value: 1500, usage_ease: 0.5, category: "travel" },
        { name: "purchase-protection", value: 50, usage_ease: 0.6 },
      ];
      const spending: CategorySpending = { streaming: 200, travel: 500 };
      // cell-phone: min(800, 200) * 0.6 = 120
      // trip: min(1500, 500) * 0.5 = 250
      // purchase (no category): 50 * 0.6 = 30
      expect(calculateBenefitsValue(benefits, spending)).toBeCloseTo(400, 3);
    });
  });

  describe("benefitMultipliers overrides", () => {
    it("overrides usage_ease with multiplier when category matches", () => {
      const benefits: Benefit[] = [
        { name: "cell-phone-protection", value: 800, usage_ease: 0.6 },
      ];
      const multipliers = { cell_phone_protection: 0 };
      expect(calculateBenefitsValue(benefits, undefined, multipliers)).toBeCloseTo(0, 3);
    });

    it("uses original usage_ease when no multiplier matches", () => {
      const benefits: Benefit[] = [
        { name: "some-unknown-perk", value: 100, usage_ease: 0.5 },
      ];
      const multipliers = { cell_phone_protection: 0 };
      expect(calculateBenefitsValue(benefits, undefined, multipliers)).toBeCloseTo(50, 3);
    });

    it("applies different multipliers to different benefit types", () => {
      const benefits: Benefit[] = [
        { name: "cell-phone-protection", value: 800, usage_ease: 0.6 },
        { name: "purchase-protection", value: 500, usage_ease: 0.6 },
        { name: "travel-lounge", value: 850, usage_ease: 0.6 },
      ];
      const multipliers = {
        cell_phone_protection: 0,
        purchase_protection: 0,
        lounge_access: 0.8,
      };
      // cell-phone: 800 * 0 = 0
      // purchase: 500 * 0 = 0
      // lounge: 850 * 0.8 = 680
      expect(calculateBenefitsValue(benefits, undefined, multipliers)).toBeCloseTo(680, 3);
    });

    it("combines spending cap with multiplier override", () => {
      const benefits: Benefit[] = [
        { name: "trip-cancellation-interruption-insurance", value: 1500, usage_ease: 0.5, category: "travel" },
      ];
      const spending: CategorySpending = { travel: 500 };
      const multipliers = { trip_cancellation: 0.2 };
      // min(1500, 500) * 0.2 = 100
      expect(calculateBenefitsValue(benefits, spending, multipliers)).toBeCloseTo(100, 3);
    });

    it("backward compat: undefined multipliers uses original usage_ease", () => {
      const benefits: Benefit[] = [
        { name: "cell-phone-protection", value: 800, usage_ease: 0.6 },
      ];
      expect(calculateBenefitsValue(benefits, undefined, undefined)).toBeCloseTo(480, 3);
    });
  });
});
