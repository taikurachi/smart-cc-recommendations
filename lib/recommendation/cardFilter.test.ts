import { describe, it, expect } from "vitest";
import { filterByPreferences, isCardOwned } from "./cardFilter";
import { makeCard } from "./testFixtures";

describe("cardFilter", () => {

  const travelCard = makeCard({ id: "travel1", name: "Travel Card", tags: ["travel"] });
  const cashbackCard = makeCard({ id: "cb1", name: "Cashback Card", tags: ["cashback", "no_annual_fee"] });
  const allRounder = makeCard({ id: "all1", name: "All Rounder", tags: ["travel", "cashback", "no_annual_fee"] });
  const businessCard = makeCard({ id: "biz1", name: "Business Card", tags: ["business"] });

  const allCards = [travelCard, cashbackCard, allRounder, businessCard];

  it("no preferences (all false) returns all cards", () => {
    const [result, msg] = filterByPreferences(allCards, { travel: false, cashback: false });
    expect(result).toHaveLength(allCards.length);
    expect(msg).toBeUndefined();
  });

  it("empty preferences object returns all cards", () => {
    const [result] = filterByPreferences(allCards, {});
    expect(result).toHaveLength(allCards.length);
  });

  it("strict match: travel + cashback returns only allRounder", () => {
    const [result, msg] = filterByPreferences(allCards, { travel: true, cashback: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("all1");
    expect(msg).toBeUndefined();
  });

  it("strict match fails, partial match returns cards with any tag", () => {
    const [result, msg] = filterByPreferences(allCards, { travel: true, business: true });
    expect(result).toHaveLength(3);
    expect(msg).toBeUndefined();
  });

  it("no matches at all returns all cards with message", () => {
    const [result, msg] = filterByPreferences(allCards, { premium: true });
    expect(result).toHaveLength(allCards.length);
    expect(msg).toBeDefined();
    expect(msg).toContain("no matches");
  });

  it("single preference filters correctly", () => {
    const [result] = filterByPreferences(allCards, { no_annual_fee: true });
    expect(result).toHaveLength(2);
    const ids = result.map((c) => c.id).sort();
    expect(ids).toEqual(["all1", "cb1"]);
  });

  it("matches by ID", () => {
    const card = makeCard({ id: "amex_platinum", name: "Platinum Card" });
    const owned = [{ id: "amex_platinum" }];
    expect(isCardOwned(card, owned)).toBe(true);
  });

  it("matches by normalized name (case-insensitive)", () => {
    const card = makeCard({ id: "c1", name: "Freedom Unlimited" });
    const owned = [{ name: "freedom unlimited" }];
    expect(isCardOwned(card, owned)).toBe(true);
  });

  it("strips trademark symbols for matching", () => {
    const card = makeCard({ id: "c1", name: "Platinum Card®" });
    const owned = [{ name: "Platinum Card" }];
    expect(isCardOwned(card, owned)).toBe(true);
  });

  it("strips TM symbol for matching", () => {
    const card = makeCard({ id: "c1", name: "SavorOne™" });
    const owned = [{ name: "SavorOne" }];
    expect(isCardOwned(card, owned)).toBe(true);
  });

  it("returns false for empty owned list", () => {
    const card = makeCard({ id: "c1", name: "Some Card" });
    expect(isCardOwned(card, [])).toBe(false);
  });

  it("returns false for null owned list", () => {
    const card = makeCard({ id: "c1", name: "Some Card" });
    // @ts-expect-error testing null
    expect(isCardOwned(card, null)).toBe(false);
  });

  it("returns false when no match", () => {
    const card = makeCard({ id: "c1", name: "Card X" });
    const owned = [{ id: "c2", name: "Card Y" }];
    expect(isCardOwned(card, owned)).toBe(false);
  });
});
