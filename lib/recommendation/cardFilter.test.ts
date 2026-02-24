import { filterByPreferences, isCardOwned } from "./cardFilter";
import { CreditCardData } from "./types";

interface TestResult { name: string; passed: boolean; error?: string }
const tests: TestResult[] = [];

function test(name: string, fn: () => void) {
  try { fn(); tests.push({ name, passed: true }); }
  catch (e: any) { tests.push({ name, passed: false, error: e.message || String(e) }); }
}

function makeCard(overrides: Partial<CreditCardData>): CreditCardData {
  return {
    id: "default",
    name: "Default",
    institution_name: "Bank",
    annual_fee: 0,
    tags: [],
    rewards: {},
    credits: [],
    benefits: [],
    image: { src: "", alt: "" },
    ...overrides,
  };
}

const travelCard = makeCard({ id: "travel1", name: "Travel Card", tags: ["travel"] });
const cashbackCard = makeCard({ id: "cb1", name: "Cashback Card", tags: ["cashback", "no_annual_fee"] });
const allRounder = makeCard({ id: "all1", name: "All Rounder", tags: ["travel", "cashback", "no_annual_fee"] });
const businessCard = makeCard({ id: "biz1", name: "Business Card", tags: ["business"] });

const allCards = [travelCard, cashbackCard, allRounder, businessCard];

// --- filterByPreferences ---

test("no preferences (all false) returns all cards", () => {
  const [result, msg] = filterByPreferences(allCards, { travel: false, cashback: false });
  if (result.length !== allCards.length) throw new Error(`Expected ${allCards.length}, got ${result.length}`);
  if (msg !== undefined) throw new Error(`Expected no message, got: ${msg}`);
});

test("empty preferences object returns all cards", () => {
  const [result] = filterByPreferences(allCards, {});
  if (result.length !== allCards.length) throw new Error(`Expected all cards`);
});

test("strict match: travel + cashback returns only allRounder", () => {
  const [result, msg] = filterByPreferences(allCards, { travel: true, cashback: true });
  if (result.length !== 1) throw new Error(`Expected 1 strict match, got ${result.length}`);
  if (result[0].id !== "all1") throw new Error(`Expected all1, got ${result[0].id}`);
  if (msg !== undefined) throw new Error(`Expected no message`);
});

test("strict match fails, partial match returns cards with any tag", () => {
  const [result, msg] = filterByPreferences(allCards, { travel: true, business: true });
  // No card has BOTH travel + business, so partial: travel1, allRounder, businessCard
  if (result.length !== 3) throw new Error(`Expected 3 partial matches, got ${result.length}`);
  if (msg !== undefined) throw new Error(`Expected no message on partial`);
});

test("no matches at all returns all cards with message", () => {
  const [result, msg] = filterByPreferences(allCards, { premium: true });
  if (result.length !== allCards.length) throw new Error(`Expected fallback to all cards`);
  if (!msg) throw new Error("Expected fallback message");
  if (!msg.includes("no matches")) throw new Error(`Unexpected message: ${msg}`);
});

test("single preference filters correctly", () => {
  const [result] = filterByPreferences(allCards, { no_annual_fee: true });
  // cashbackCard and allRounder have no_annual_fee
  if (result.length !== 2) throw new Error(`Expected 2, got ${result.length}`);
  const ids = result.map((c) => c.id).sort();
  if (ids[0] !== "all1" || ids[1] !== "cb1") throw new Error(`Wrong cards: ${ids}`);
});

// --- isCardOwned ---

test("matches by ID", () => {
  const card = makeCard({ id: "amex_platinum", name: "Platinum Card" });
  const owned = [{ id: "amex_platinum" }];
  if (!isCardOwned(card, owned)) throw new Error("Should match by ID");
});

test("matches by normalized name (case-insensitive)", () => {
  const card = makeCard({ id: "c1", name: "Freedom Unlimited" });
  const owned = [{ name: "freedom unlimited" }];
  if (!isCardOwned(card, owned)) throw new Error("Should match case-insensitively");
});

test("strips trademark symbols for matching", () => {
  const card = makeCard({ id: "c1", name: "Platinum Card®" });
  const owned = [{ name: "Platinum Card" }];
  if (!isCardOwned(card, owned)) throw new Error("Should strip ® for matching");
});

test("strips TM symbol for matching", () => {
  const card = makeCard({ id: "c1", name: "SavorOne™" });
  const owned = [{ name: "SavorOne" }];
  if (!isCardOwned(card, owned)) throw new Error("Should strip ™ for matching");
});

test("returns false for empty owned list", () => {
  const card = makeCard({ id: "c1", name: "Some Card" });
  if (isCardOwned(card, [])) throw new Error("Should return false for empty owned");
});

test("returns false for null owned list", () => {
  const card = makeCard({ id: "c1", name: "Some Card" });
  // @ts-expect-error testing null
  if (isCardOwned(card, null)) throw new Error("Should return false for null");
});

test("returns false when no match", () => {
  const card = makeCard({ id: "c1", name: "Card X" });
  const owned = [{ id: "c2", name: "Card Y" }];
  if (isCardOwned(card, owned)) throw new Error("Should not match different card");
});

// --- Report ---
console.log("\n--- cardFilter.test.ts ---\n");
let passed = 0, failed = 0;
tests.forEach((t) => {
  if (t.passed) { passed++; console.log(`  ✅ ${t.name}`); }
  else { failed++; console.log(`  ❌ ${t.name}: ${t.error}`); }
});
console.log(`\n  Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) process.exit(1);
