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

  // --- TRANSPORTATION ---
  it("TRANSPORTATION_GAS maps to gas", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_GAS", confidence_level: "VERY_HIGH" }),
    ).toBe("gas");
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

  // --- Edge cases ---
  it("undefined input returns general", () => {
    expect(mapTransactionCategoryToRewardCategory(undefined)).toBe("general");
  });

  it("unknown primary returns general", () => {
    expect(
      mapTransactionCategoryToRewardCategory({ primary: "MEDICAL", detailed: "MEDICAL_DENTIST", confidence_level: "HIGH" }),
    ).toBe("general");
  });
});
