import { calculateCreditsValue } from "./creditsCalculator";
import { Credit } from "./types";
import { createTestRunner, eq } from "./testUtils";

const { test, report } = createTestRunner();

test("empty array returns 0", () => {
  eq(calculateCreditsValue([]), 0);
});

test("single credit with usage_ease 1.0 returns full value", () => {
  const credits: Credit[] = [{ name: "uber", value: 200, usage_ease: 1.0 }];
  eq(calculateCreditsValue(credits), 200);
});

test("usage_ease 0 returns 0", () => {
  const credits: Credit[] = [{ name: "saks", value: 100, usage_ease: 0 }];
  eq(calculateCreditsValue(credits), 0);
});

test("fractional usage_ease scales correctly", () => {
  const credits: Credit[] = [{ name: "hotel", value: 600, usage_ease: 0.4 }];
  eq(calculateCreditsValue(credits), 240);
});

test("multiple credits sum correctly", () => {
  const credits: Credit[] = [
    { name: "uber", value: 200, usage_ease: 0.9 },
    { name: "hotel", value: 600, usage_ease: 0.4 },
    { name: "airline-fee", value: 200, usage_ease: 0.5 },
  ];
  eq(calculateCreditsValue(credits), 520);
});

test("handles null/undefined gracefully", () => {
  // @ts-expect-error testing null input
  eq(calculateCreditsValue(null), 0);
  // @ts-expect-error testing undefined input
  eq(calculateCreditsValue(undefined), 0);
});

report("creditsCalculator.test.ts");
