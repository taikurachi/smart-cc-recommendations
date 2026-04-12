import { describe, expect, it } from "vitest";
import {
  enrichCreditMatchMetadata,
  getBackfilledCreditMatchKeywords,
  normalizeCreditMatchKeywords,
} from "./creditMatchMetadata";

describe("creditMatchMetadata", () => {
  it("backfills uber keywords from the credit name", () => {
    expect(getBackfilledCreditMatchKeywords("Uber Cash")).toEqual(["uber"]);
  });

  it("backfills doordash keywords from dashpass-style names", () => {
    expect(
      getBackfilledCreditMatchKeywords("DoorDash credits & DashPass"),
    ).toEqual(["doordash"]);
  });

  it("returns no backfill for unrelated credits", () => {
    expect(getBackfilledCreditMatchKeywords("airline incidental credit")).toEqual(
      [],
    );
  });

  it("normalizes existing keywords", () => {
    expect(normalizeCreditMatchKeywords([" Uber ", "uber", "DUNKIN"])).toEqual(
      ["uber", "dunkin"],
    );
  });

  it("preserves explicit match metadata when present", () => {
    const credit = enrichCreditMatchMetadata({
      name: "Dining credit",
      value: 120,
      usage_ease: 0.8,
      match: { keywords: ["Resy", " resy "] },
    });

    expect(credit.match?.keywords).toEqual(["resy"]);
  });

  it("adds backfilled match metadata for supported merchant credits", () => {
    const credit = enrichCreditMatchMetadata({
      name: "Lululemon credit",
      value: 100,
      usage_ease: 0.5,
    });

    expect(credit.match?.keywords).toEqual(["lululemon"]);
  });
});
