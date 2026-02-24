import { mapTransactionCategoryToRewardCategory } from "./categoryMapper";

interface TestResult { name: string; passed: boolean; error?: string }
const tests: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    tests.push({ name, passed: true });
  } catch (e: any) {
    tests.push({ name, passed: false, error: e.message || String(e) });
  }
}

function eq<T>(actual: T, expected: T, label?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${label || "Mismatch"}: got ${a}, expected ${b}`);
}

// --- FOOD_AND_DRINK ---
test("FOOD_AND_DRINK primary maps to dining", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" }),
    ["dining"]
  );
});

test("FOOD_AND_DRINK_GROCERIES maps to grocery", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" }),
    ["grocery"]
  );
});

test("FOOD_AND_DRINK_COFFEE maps to dining (fallback)", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_COFFEE", confidence_level: "HIGH" }),
    ["dining"]
  );
});

// --- TRAVEL ---
test("TRAVEL primary maps to travel", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" }),
    ["travel"]
  );
});

test("TRAVEL_LODGING maps to hotels", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "TRAVEL", detailed: "TRAVEL_LODGING", confidence_level: "VERY_HIGH" }),
    ["hotels"]
  );
});

// --- TRANSPORTATION ---
test("TRANSPORTATION_GAS maps to gas", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_GAS", confidence_level: "VERY_HIGH" }),
    ["gas"]
  );
});

test("TRANSPORTATION_TAXIS_AND_RIDE_SHARES maps to travel", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", confidence_level: "HIGH" }),
    ["travel"]
  );
});

test("TRANSPORTATION_PUBLIC_TRANSIT maps to travel", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_PUBLIC_TRANSIT", confidence_level: "HIGH" }),
    ["travel"]
  );
});

test("TRANSPORTATION generic falls back to general", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_PARKING", confidence_level: "HIGH" }),
    ["general"]
  );
});

// --- GENERAL_MERCHANDISE ---
test("GENERAL_MERCHANDISE_ONLINE_MARKETPLACES maps to online-shopping", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" }),
    ["online-shopping"]
  );
});

test("GENERAL_MERCHANDISE_PHARMACIES maps to drugstores", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_PHARMACIES", confidence_level: "HIGH" }),
    ["drugstores"]
  );
});

test("GENERAL_MERCHANDISE_SUPERSTORES maps to wholesale-clubs", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_SUPERSTORES", confidence_level: "HIGH" }),
    ["wholesale-clubs"]
  );
});

test("GENERAL_MERCHANDISE_WAREHOUSE_CLUBS maps to wholesale-clubs", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_WAREHOUSE_CLUBS_AND_SUPERCENTERS", confidence_level: "HIGH" }),
    ["wholesale-clubs"]
  );
});

test("GENERAL_MERCHANDISE generic falls back to general", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", confidence_level: "HIGH" }),
    ["general"]
  );
});

// --- ENTERTAINMENT ---
test("ENTERTAINMENT_MUSIC_AND_AUDIO maps to streaming", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_MUSIC_AND_AUDIO", confidence_level: "HIGH" }),
    ["streaming"]
  );
});

test("ENTERTAINMENT_TV_AND_MOVIES maps to streaming", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_TV_AND_MOVIES", confidence_level: "HIGH" }),
    ["streaming"]
  );
});

test("ENTERTAINMENT generic falls back to general", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_SPORTING_EVENTS_AND_SPORTS_VENUES", confidence_level: "HIGH" }),
    ["general"]
  );
});

// --- RENT_AND_UTILITIES ---
test("RENT_AND_UTILITIES_INTERNET_AND_CABLE maps to streaming", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_INTERNET_AND_CABLE", confidence_level: "HIGH" }),
    ["streaming"]
  );
});

test("RENT_AND_UTILITIES_TELEPHONE maps to streaming", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_TELEPHONE", confidence_level: "HIGH" }),
    ["streaming"]
  );
});

test("RENT_AND_UTILITIES generic falls back to general", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_RENT", confidence_level: "HIGH" }),
    ["general"]
  );
});

// --- Edge cases ---
test("undefined input returns general", () => {
  eq(mapTransactionCategoryToRewardCategory(undefined), ["general"]);
});

test("unknown primary returns general", () => {
  eq(
    mapTransactionCategoryToRewardCategory({ primary: "MEDICAL", detailed: "MEDICAL_DENTIST", confidence_level: "HIGH" }),
    ["general"]
  );
});

// --- Report ---
console.log("\n--- categoryMapper.test.ts ---\n");
let passed = 0;
let failed = 0;
tests.forEach((t) => {
  if (t.passed) { passed++; console.log(`  ✅ ${t.name}`); }
  else { failed++; console.log(`  ❌ ${t.name}: ${t.error}`); }
});
console.log(`\n  Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) process.exit(1);
