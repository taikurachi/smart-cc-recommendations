import { mapTransactionCategoryToRewardCategory } from "./categoryMapper";
import { createTestRunner } from "./testUtils";

const { test, report } = createTestRunner();

function eqJson<T>(actual: T, expected: T, label?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${label || "Mismatch"}: got ${a}, expected ${b}`);
}

// --- FOOD_AND_DRINK ---
test("FOOD_AND_DRINK primary maps to dining", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" }),
    ["dining"]
  );
});

test("FOOD_AND_DRINK_GROCERIES maps to grocery", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" }),
    ["grocery"]
  );
});

test("FOOD_AND_DRINK_COFFEE maps to dining (fallback)", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_COFFEE", confidence_level: "HIGH" }),
    ["dining"]
  );
});

// --- TRAVEL ---
test("TRAVEL primary maps to travel", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" }),
    ["travel"]
  );
});

test("TRAVEL_LODGING maps to hotels", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "TRAVEL", detailed: "TRAVEL_LODGING", confidence_level: "VERY_HIGH" }),
    ["hotels"]
  );
});

// --- TRANSPORTATION ---
test("TRANSPORTATION_GAS maps to gas", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_GAS", confidence_level: "VERY_HIGH" }),
    ["gas"]
  );
});

test("TRANSPORTATION_TAXIS_AND_RIDE_SHARES maps to transit", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", confidence_level: "HIGH" }),
    ["transit"]
  );
});

test("TRANSPORTATION_PUBLIC_TRANSIT maps to transit", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_PUBLIC_TRANSIT", confidence_level: "HIGH" }),
    ["transit"]
  );
});

test("TRANSPORTATION_PARKING maps to transit", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_PARKING", confidence_level: "HIGH" }),
    ["transit"]
  );
});

test("TRANSPORTATION_TOLLS maps to transit", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_TOLLS", confidence_level: "HIGH" }),
    ["transit"]
  );
});

test("TRANSPORTATION generic falls back to general", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_OTHER", confidence_level: "HIGH" }),
    ["general"]
  );
});

// --- GENERAL_MERCHANDISE ---
test("GENERAL_MERCHANDISE_ONLINE_MARKETPLACES maps to online-shopping", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" }),
    ["online-shopping"]
  );
});

test("GENERAL_MERCHANDISE_PHARMACIES maps to drugstores", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_PHARMACIES", confidence_level: "HIGH" }),
    ["drugstores"]
  );
});

test("GENERAL_MERCHANDISE_SUPERSTORES maps to wholesale-clubs", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_SUPERSTORES", confidence_level: "HIGH" }),
    ["wholesale-clubs"]
  );
});

test("GENERAL_MERCHANDISE_WAREHOUSE_CLUBS maps to wholesale-clubs", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_WAREHOUSE_CLUBS_AND_SUPERCENTERS", confidence_level: "HIGH" }),
    ["wholesale-clubs"]
  );
});

test("GENERAL_MERCHANDISE generic falls back to general", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", confidence_level: "HIGH" }),
    ["general"]
  );
});

// --- ENTERTAINMENT ---
test("ENTERTAINMENT_MUSIC_AND_AUDIO maps to streaming", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_MUSIC_AND_AUDIO", confidence_level: "HIGH" }),
    ["streaming"]
  );
});

test("ENTERTAINMENT_TV_AND_MOVIES maps to streaming", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_TV_AND_MOVIES", confidence_level: "HIGH" }),
    ["streaming"]
  );
});

test("ENTERTAINMENT_SPORTING_EVENTS maps to entertainment", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_SPORTING_EVENTS_AND_SPORTS_VENUES", confidence_level: "HIGH" }),
    ["entertainment"]
  );
});

test("ENTERTAINMENT_VIDEO_GAMES maps to entertainment", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_VIDEO_GAMES", confidence_level: "HIGH" }),
    ["entertainment"]
  );
});

// --- RENT_AND_UTILITIES ---
test("RENT_AND_UTILITIES_INTERNET_AND_CABLE maps to streaming", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_INTERNET_AND_CABLE", confidence_level: "HIGH" }),
    ["streaming"]
  );
});

test("RENT_AND_UTILITIES_TELEPHONE maps to streaming", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_TELEPHONE", confidence_level: "HIGH" }),
    ["streaming"]
  );
});

test("RENT_AND_UTILITIES generic falls back to general", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_RENT", confidence_level: "HIGH" }),
    ["general"]
  );
});

// --- Edge cases ---
test("undefined input returns general", () => {
  eqJson(mapTransactionCategoryToRewardCategory(undefined), ["general"]);
});

test("unknown primary returns general", () => {
  eqJson(
    mapTransactionCategoryToRewardCategory({ primary: "MEDICAL", detailed: "MEDICAL_DENTIST", confidence_level: "HIGH" }),
    ["general"]
  );
});

report("categoryMapper.test.ts");
