import { describe, it, expect } from "vitest";
import { calculateCreditsValue } from "./creditsCalculator";
import { Credit, CategorySpending } from "./types";

describe("creditsCalculator", () => {
  it("empty array returns 0", () => {
    expect(calculateCreditsValue([])).toBeCloseTo(0, 3);
  });

  it("single credit with usage_ease 1.0 returns full value", () => {
    const credits: Credit[] = [{ name: "uber", value: 200, usage_ease: 1.0 }];
    expect(calculateCreditsValue(credits)).toBeCloseTo(200, 3);
  });

  it("usage_ease 0 returns 0", () => {
    const credits: Credit[] = [{ name: "saks", value: 100, usage_ease: 0 }];
    expect(calculateCreditsValue(credits)).toBeCloseTo(0, 3);
  });

  it("fractional usage_ease scales correctly", () => {
    const credits: Credit[] = [{ name: "hotel", value: 600, usage_ease: 0.4 }];
    expect(calculateCreditsValue(credits)).toBeCloseTo(240, 3);
  });

  it("multiple credits sum correctly", () => {
    const credits: Credit[] = [
      { name: "uber", value: 200, usage_ease: 0.9 },
      { name: "hotel", value: 600, usage_ease: 0.4 },
      { name: "airline-fee", value: 200, usage_ease: 0.5 },
    ];
    expect(calculateCreditsValue(credits)).toBeCloseTo(520, 3);
  });

  it("handles null/undefined gracefully", () => {
    // @ts-expect-error testing null input
    expect(calculateCreditsValue(null)).toBeCloseTo(0, 3);
    // @ts-expect-error testing undefined input
    expect(calculateCreditsValue(undefined)).toBeCloseTo(0, 3);
  });

  describe("spending-aware (with categorySpending)", () => {
    it("caps credit value by actual spending in its category", () => {
      const credits: Credit[] = [
        { name: "dining-credit", value: 200, usage_ease: 1.0, category: "dining" },
      ];
      const spending: CategorySpending = { dining: 150 };
      // min(200, 150) * 1.0 = 150
      expect(calculateCreditsValue(credits, spending)).toBeCloseTo(150, 3);
    });

    it("does not cap when spending exceeds credit value", () => {
      const credits: Credit[] = [
        { name: "dining-credit", value: 200, usage_ease: 0.9, category: "dining" },
      ];
      const spending: CategorySpending = { dining: 5000 };
      // min(200, 5000) * 0.9 = 180
      expect(calculateCreditsValue(credits, spending)).toBeCloseTo(180, 3);
    });

    it("returns 0 for category credit with zero spending", () => {
      const credits: Credit[] = [
        { name: "travel-credit", value: 300, usage_ease: 1.0, category: "travel" },
      ];
      const spending: CategorySpending = {};
      // min(300, 0) * 1.0 = 0
      expect(calculateCreditsValue(credits, spending)).toBeCloseTo(0, 3);
    });

    it("credits without category ignore categorySpending", () => {
      const credits: Credit[] = [
        { name: "saks", value: 100, usage_ease: 0.5 },
      ];
      const spending: CategorySpending = {};
      // no category → full value * usage_ease = 50
      expect(calculateCreditsValue(credits, spending)).toBeCloseTo(50, 3);
    });

    it("mixes capped and uncapped credits correctly", () => {
      const credits: Credit[] = [
        { name: "dining-credit", value: 200, usage_ease: 1.0, category: "dining" },
        { name: "general-perk", value: 100, usage_ease: 0.5 },
      ];
      const spending: CategorySpending = { dining: 80 };
      // dining: min(200, 80) * 1.0 = 80
      // general: 100 * 0.5 = 50
      expect(calculateCreditsValue(credits, spending)).toBeCloseTo(130, 3);
    });

    it("backward compat: no categorySpending uses original behavior", () => {
      const credits: Credit[] = [
        { name: "dining-credit", value: 200, usage_ease: 0.9, category: "dining" },
      ];
      // no categorySpending → 200 * 0.9 = 180
      expect(calculateCreditsValue(credits)).toBeCloseTo(180, 3);
    });
  });
});
