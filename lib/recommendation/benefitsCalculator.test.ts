import { calculateBenefitsValue, calculateIntroBonusValue } from "./benefitsCalculator";
import { Benefit } from "./types";
import { createTestRunner, eq } from "./testUtils";

const { test, report } = createTestRunner();

const sampleBenefits: Benefit[] = [
  { name: "intro-bonus", value: 3000, usage_ease: 0.6 },
  { name: "travel-lounge", value: 850, usage_ease: 0.6 },
  { name: "travel-insurance", value: 200, usage_ease: 0.3 },
  { name: "purchase-protection", value: 50, usage_ease: 0.2 },
];

test("excludes intro-bonus from benefits total", () => {
  eq(calculateBenefitsValue(sampleBenefits), 580);
});

test("empty array returns 0 for benefits", () => {
  eq(calculateBenefitsValue([]), 0);
});

test("handles null/undefined gracefully for benefits", () => {
  // @ts-expect-error testing null
  eq(calculateBenefitsValue(null), 0);
});

test("benefits with only intro-bonus returns 0", () => {
  const onlyIntro: Benefit[] = [{ name: "intro-bonus", value: 500, usage_ease: 0.8 }];
  eq(calculateBenefitsValue(onlyIntro), 0);
});

test("benefits with no intro-bonus sums all", () => {
  const noBonusBenefits: Benefit[] = [
    { name: "lounge", value: 100, usage_ease: 1.0 },
    { name: "insurance", value: 50, usage_ease: 0.5 },
  ];
  eq(calculateBenefitsValue(noBonusBenefits), 125);
});

test("extracts intro-bonus with correct usage_ease", () => {
  eq(calculateIntroBonusValue(sampleBenefits), 1800);
});

test("returns 0 when no intro-bonus present", () => {
  const noBonusBenefits: Benefit[] = [
    { name: "lounge", value: 100, usage_ease: 1.0 },
  ];
  eq(calculateIntroBonusValue(noBonusBenefits), 0);
});

test("empty array returns 0 for intro bonus", () => {
  eq(calculateIntroBonusValue([]), 0);
});

test("handles null/undefined gracefully for intro bonus", () => {
  // @ts-expect-error testing null
  eq(calculateIntroBonusValue(null), 0);
});

test("intro-bonus usage_ease 0 returns 0", () => {
  const zeroBonusBenefits: Benefit[] = [
    { name: "intro-bonus", value: 1000, usage_ease: 0 },
  ];
  eq(calculateIntroBonusValue(zeroBonusBenefits), 0);
});

report("benefitsCalculator.test.ts");
