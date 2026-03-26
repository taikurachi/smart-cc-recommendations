import { calculateCreditsValue } from "./creditsCalculator";
import { Credit } from "./types";

interface TestResult { name: string; passed: boolean; error?: string }
const tests: TestResult[] = [];

function test(name: string, fn: () => void) {
  try { fn(); tests.push({ name, passed: true }); }
  catch (e: unknown) { tests.push({ name, passed: false, error: e instanceof Error ? e.message : String(e) }); }
}

function eq(actual: number, expected: number, label?: string) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`${label || "Mismatch"}: got ${actual}, expected ${expected}`);
  }
}

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
  // 200*0.9 + 600*0.4 + 200*0.5 = 180 + 240 + 100 = 520
  eq(calculateCreditsValue(credits), 520);
});

test("handles null/undefined gracefully", () => {
  // @ts-expect-error testing null input
  eq(calculateCreditsValue(null), 0);
  // @ts-expect-error testing undefined input
  eq(calculateCreditsValue(undefined), 0);
});

// --- Report ---
console.log("\n--- creditsCalculator.test.ts ---\n");
let passed = 0, failed = 0;
tests.forEach((t) => {
  if (t.passed) { passed++; console.log(`  ✅ ${t.name}`); }
  else { failed++; console.log(`  ❌ ${t.name}: ${t.error}`); }
});
console.log(`\n  Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) process.exit(1);
