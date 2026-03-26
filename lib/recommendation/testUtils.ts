export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export function createTestRunner() {
  const tests: TestResult[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      tests.push({ name, passed: true });
    } catch (e: unknown) {
      tests.push({
        name,
        passed: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  function report(suiteName: string) {
    console.log(`\n--- ${suiteName} ---\n`);
    let passed = 0;
    let failed = 0;
    tests.forEach((t) => {
      if (t.passed) {
        passed++;
        console.log(`  ✅ ${t.name}`);
      } else {
        failed++;
        console.log(`  ❌ ${t.name}: ${t.error}`);
      }
    });
    console.log(
      `\n  Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}\n`,
    );
    if (failed > 0) process.exit(1);
  }

  return { tests, test, report };
}

export function eq(actual: number, expected: number, label?: string) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(
      `${label || "Mismatch"}: got ${actual}, expected ${expected}`,
    );
  }
}
