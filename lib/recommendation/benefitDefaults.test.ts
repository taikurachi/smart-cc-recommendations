import { describe, it, expect } from "vitest";
import {
  matchBenefitCategory,
  getDefaultBenefitMultipliers,
  resolveMultiplier,
  BENEFIT_CATEGORIES,
} from "./benefitDefaults";

describe("benefitDefaults", () => {
  describe("matchBenefitCategory", () => {
    it("matches cell-phone-protection to cell_phone_protection", () => {
      expect(matchBenefitCategory("cell-phone-protection")).toBe(
        "cell_phone_protection",
      );
    });

    it("matches purchase-protection to purchase_protection", () => {
      expect(matchBenefitCategory("purchase-protection")).toBe(
        "purchase_protection",
      );
    });

    it("matches purchase_protection (underscore variant)", () => {
      expect(matchBenefitCategory("purchase_protection")).toBe(
        "purchase_protection",
      );
    });

    it("matches trip-cancellation-interruption-insurance to trip_cancellation", () => {
      expect(
        matchBenefitCategory("trip-cancellation-interruption-insurance"),
      ).toBe("trip_cancellation");
    });

    it("matches lost-luggage-reimbursement to lost_luggage", () => {
      expect(matchBenefitCategory("lost-luggage-reimbursement")).toBe(
        "lost_luggage",
      );
    });

    it("matches travel-lounge to lounge_access", () => {
      expect(matchBenefitCategory("travel-lounge")).toBe("lounge_access");
    });

    it("matches uber to uber_credits", () => {
      expect(matchBenefitCategory("uber")).toBe("uber_credits");
    });

    it("matches Uber Cash (case-insensitive)", () => {
      expect(matchBenefitCategory("Uber Cash")).toBe("uber_credits");
    });

    it("matches DoorDash credits & DashPass to doordash_credits", () => {
      expect(matchBenefitCategory("DoorDash credits & DashPass")).toBe(
        "doordash_credits",
      );
    });

    it("matches door-dash_dashpass to doordash_credits", () => {
      expect(matchBenefitCategory("door-dash_dashpass")).toBe(
        "doordash_credits",
      );
    });

    it("matches auto-rental-collision to rental_car_insurance", () => {
      expect(matchBenefitCategory("auto-rental-collision")).toBe(
        "rental_car_insurance",
      );
    });

    it("matches no-foreign-transaction-fees to no_foreign_tx_fees", () => {
      expect(matchBenefitCategory("no-foreign-transaction-fees")).toBe(
        "no_foreign_tx_fees",
      );
    });

    it("returns null for unrecognized benefit names", () => {
      expect(matchBenefitCategory("some-random-unique-benefit")).toBeNull();
    });
  });

  describe("getDefaultBenefitMultipliers", () => {
    it("returns a record with an entry for every category", () => {
      const defaults = getDefaultBenefitMultipliers();
      for (const cat of BENEFIT_CATEGORIES) {
        expect(defaults).toHaveProperty(cat.id);
        expect(defaults[cat.id]).toBe(cat.defaultMultiplier);
      }
    });

    it("insurance benefits default to 0", () => {
      const defaults = getDefaultBenefitMultipliers();
      const insuranceCats = BENEFIT_CATEGORIES.filter(
        (c) => c.group === "insurance",
      );
      for (const cat of insuranceCats) {
        expect(defaults[cat.id]).toBe(0);
      }
    });
  });

  describe("resolveMultiplier", () => {
    it("uses override when category matches", () => {
      const overrides = { cell_phone_protection: 0.1 };
      expect(resolveMultiplier("cell-phone-protection", 0.6, overrides)).toBe(
        0.1,
      );
    });

    it("falls back to original when no category matches", () => {
      const overrides = { cell_phone_protection: 0 };
      expect(resolveMultiplier("some-unknown-perk", 0.5, overrides)).toBe(0.5);
    });

    it("falls back to original when overrides is undefined", () => {
      expect(resolveMultiplier("cell-phone-protection", 0.6, undefined)).toBe(
        0.6,
      );
    });

    it("uses 0 override correctly (not falsy skip)", () => {
      const overrides = { cell_phone_protection: 0 };
      expect(resolveMultiplier("cell-phone-protection", 0.6, overrides)).toBe(
        0,
      );
    });
  });
});
