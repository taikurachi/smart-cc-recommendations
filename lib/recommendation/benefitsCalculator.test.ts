import { calculateBenefitsValue, calculateIntroBonusValue } from "./benefitsCalculator";
import { Benefit } from "./types";

interface TestResult { name: string; passed: boolean; error?: string }
const tests: TestResult[] = [];

function test(name: string, fn: () => void) {
  try { fn(); tests.push({ name, passed: true }); }
  catch (e: any) { tests.push({ name, passed: false, error: e.message || String(e) }); }
}

function eq(actual: number, expected: number, label?: string) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`${label || "Mismatch"}: got ${actual}, expected ${expected}`);
  }
}

const sampleBenefits: Benefit[] = [
  { name: "intro-bonus", value: 3000, usage_ease: 0.6 },
  { name: "travel-lounge", value: 850, usage_ease: 0.6 },
  { name: "travel-insurance", value: 200, usage_ease: 0.3 },
  { name: "purchase-protection", value: 50, usage_ease: 0.2 },
];

// --- calculateBenefitsValue ---

test("excludes intro-bonus from benefits total", () => {
  // 850*0.6 + 200*0.3 + 50*0.2 = 510 + 60 + 10 = 580
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
  // 100*1.0 + 50*0.5 = 125
  eq(calculateBenefitsValue(noBonusBenefits), 125);
});

// --- calculateIntroBonusValue ---

test("extracts intro-bonus with correct usage_ease", () => {
  // 3000 * 0.6 = 1800
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

// --- Report ---
console.log("\n--- benefitsCalculator.test.ts ---\n");
let passed = 0, failed = 0;
tests.forEach((t) => {
  if (t.passed) { passed++; console.log(`  ✅ ${t.name}`); }
  else { failed++; console.log(`  ❌ ${t.name}: ${t.error}`); }
});
console.log(`\n  Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) process.exit(1);
