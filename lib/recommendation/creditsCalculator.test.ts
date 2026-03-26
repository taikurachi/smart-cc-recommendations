import { describe, it, expect } from "vitest";
import { calculateCreditsValue } from "./creditsCalculator";
import { Credit } from "./types";

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
});
