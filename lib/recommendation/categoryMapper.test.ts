import { describe, it, expect } from "vitest";
import { mapTransactionCategoryToRewardCategory } from "./categoryMapper";

describe("categoryMapper", () => {
  // --- FOOD_AND_DRINK ---
  it("FOOD_AND_DRINK primary maps to dining", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" }),
    ).toBe("dining");
  });

  it("FOOD_AND_DRINK_GROCERIES maps to grocery", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" }),
    ).toBe("grocery");
  });

  it("FOOD_AND_DRINK_COFFEE maps to dining (fallback)", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_COFFEE", confidence_level: "HIGH" }),
    ).toBe("dining");
  });

  it("FOOD_AND_DRINK_FAST_FOOD maps to dining", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_FAST_FOOD", confidence_level: "VERY_HIGH" }),
    ).toBe("dining");
  });

  it("FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR maps to dining", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR", confidence_level: "HIGH" }),
    ).toBe("dining");
  });

  // --- TRAVEL ---
  it("TRAVEL primary maps to travel", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" }),
    ).toBe("travel");
  });

  it("TRAVEL_LODGING maps to hotels", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRAVEL", detailed: "TRAVEL_LODGING", confidence_level: "VERY_HIGH" }),
    ).toBe("hotels");
  });

  it("TRAVEL_CAR_AND_TRUCK_RENTALS maps to travel", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRAVEL", detailed: "TRAVEL_CAR_AND_TRUCK_RENTALS", confidence_level: "HIGH" }),
    ).toBe("travel");
  });

  // --- TRANSPORTATION ---
  it("TRANSPORTATION_GAS maps to gas", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_GAS", confidence_level: "VERY_HIGH" }),
    ).toBe("gas");
  });

  it("TRANSPORTATION_CAR_RENTAL maps to travel", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_CAR_RENTAL", confidence_level: "HIGH" }),
    ).toBe("travel");
  });

  it("TRANSPORTATION_TAXIS_AND_RIDE_SHARES maps to transit", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", confidence_level: "HIGH" }),
    ).toBe("transit");
  });

  it("TRANSPORTATION_PUBLIC_TRANSIT maps to transit", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_PUBLIC_TRANSIT", confidence_level: "HIGH" }),
    ).toBe("transit");
  });

  it("TRANSPORTATION_PARKING maps to transit", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_PARKING", confidence_level: "HIGH" }),
    ).toBe("transit");
  });

  it("TRANSPORTATION_TOLLS maps to transit", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_TOLLS", confidence_level: "HIGH" }),
    ).toBe("transit");
  });

  it("TRANSPORTATION generic falls back to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_OTHER", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  // --- GENERAL_MERCHANDISE ---
  it("GENERAL_MERCHANDISE_ONLINE_MARKETPLACES maps to online-shopping", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" }),
    ).toBe("online-shopping");
  });

  it("GENERAL_MERCHANDISE_PHARMACIES maps to drugstores", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_PHARMACIES", confidence_level: "HIGH" }),
    ).toBe("drugstores");
  });

  it("GENERAL_MERCHANDISE_SUPERSTORES maps to wholesale-clubs", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_SUPERSTORES", confidence_level: "HIGH" }),
    ).toBe("wholesale-clubs");
  });

  it("GENERAL_MERCHANDISE_WAREHOUSE_CLUBS maps to wholesale-clubs", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_WAREHOUSE_CLUBS_AND_SUPERCENTERS", confidence_level: "HIGH" }),
    ).toBe("wholesale-clubs");
  });

  it("GENERAL_MERCHANDISE generic falls back to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("GENERAL_MERCHANDISE_ELECTRONICS falls back to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ELECTRONICS", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("GENERAL_MERCHANDISE_DEPARTMENT_STORES falls back to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_DEPARTMENT_STORES", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  // --- ENTERTAINMENT ---
  it("ENTERTAINMENT_MUSIC_AND_AUDIO maps to streaming", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_MUSIC_AND_AUDIO", confidence_level: "HIGH" }),
    ).toBe("streaming");
  });

  it("ENTERTAINMENT_TV_AND_MOVIES maps to streaming", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_TV_AND_MOVIES", confidence_level: "HIGH" }),
    ).toBe("streaming");
  });

  it("ENTERTAINMENT_SPORTING_EVENTS maps to entertainment", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_SPORTING_EVENTS_AND_SPORTS_VENUES", confidence_level: "HIGH" }),
    ).toBe("entertainment");
  });

  it("ENTERTAINMENT_VIDEO_GAMES maps to entertainment", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_VIDEO_GAMES", confidence_level: "HIGH" }),
    ).toBe("entertainment");
  });

  it("ENTERTAINMENT_CASINOS_AND_GAMBLING maps to entertainment", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "ENTERTAINMENT", detailed: "ENTERTAINMENT_CASINOS_AND_GAMBLING", confidence_level: "HIGH" }),
    ).toBe("entertainment");
  });

  // --- RENT_AND_UTILITIES ---
  it("RENT_AND_UTILITIES_INTERNET_AND_CABLE maps to streaming", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_INTERNET_AND_CABLE", confidence_level: "HIGH" }),
    ).toBe("streaming");
  });

  it("RENT_AND_UTILITIES_TELEPHONE maps to streaming", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_TELEPHONE", confidence_level: "HIGH" }),
    ).toBe("streaming");
  });

  it("RENT_AND_UTILITIES generic falls back to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_RENT", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("RENT_AND_UTILITIES_GAS_AND_ELECTRICITY falls back to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("RENT_AND_UTILITIES_WATER falls back to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "RENT_AND_UTILITIES", detailed: "RENT_AND_UTILITIES_WATER", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  // --- Explicitly handled primaries that map to general ---

  it("HOME_IMPROVEMENT maps to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "HOME_IMPROVEMENT", detailed: "HOME_IMPROVEMENT_HARDWARE", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("MEDICAL maps to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "MEDICAL", detailed: "MEDICAL_DENTIST", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("MEDICAL_VETERINARY_SERVICES maps to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "MEDICAL", detailed: "MEDICAL_VETERINARY_SERVICES", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("PERSONAL_CARE maps to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "PERSONAL_CARE", detailed: "PERSONAL_CARE_HAIR_AND_BEAUTY", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("GENERAL_SERVICES maps to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GENERAL_SERVICES", detailed: "GENERAL_SERVICES_CONSULTING_AND_LEGAL", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("GOVERNMENT_AND_NON_PROFIT maps to general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "GOVERNMENT_AND_NON_PROFIT", detailed: "GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  // --- Non-spending primaries (filtered upstream, but still return general defensively) ---

  it("INCOME maps to general (filtered upstream)", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "INCOME", detailed: "INCOME_WAGES", confidence_level: "VERY_HIGH" }),
    ).toBe("general");
  });

  it("LOAN_PAYMENTS maps to general (filtered upstream)", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "LOAN_PAYMENTS", detailed: "LOAN_PAYMENTS_MORTGAGE_PAYMENT", confidence_level: "VERY_HIGH" }),
    ).toBe("general");
  });

  it("TRANSFER_IN maps to general (filtered upstream)", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSFER_IN", detailed: "TRANSFER_IN_DEPOSIT", confidence_level: "VERY_HIGH" }),
    ).toBe("general");
  });

  it("TRANSFER_OUT maps to general (filtered upstream)", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSFER_OUT", detailed: "TRANSFER_OUT_ACCOUNT_TRANSFER", confidence_level: "VERY_HIGH" }),
    ).toBe("general");
  });

  it("BANK_FEES maps to general (filtered upstream)", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "BANK_FEES", detailed: "BANK_FEES_ATM_FEES", confidence_level: "VERY_HIGH" }),
    ).toBe("general");
  });

  // --- Edge cases ---
  it("undefined input returns general", () => {
    expect(mapTransactionCategoryToRewardCategory(undefined)).toBe("general");
  });

  it("unknown primary returns general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TOTALLY_UNKNOWN", detailed: "TOTALLY_UNKNOWN_THING", confidence_level: "HIGH" }),
    ).toBe("general");
  });

  it("empty strings return general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "", detailed: "", confidence_level: "" }),
    ).toBe("general");
  });
});
