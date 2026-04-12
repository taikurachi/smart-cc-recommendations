import * as fs from "fs";
import * as path from "path";
import { creditKinds, inferCreditKind } from "../lib/recommendation/types";

const VALID_CREDIT_KINDS = new Set(creditKinds);

/**
 * Deterministic normalization for GPT-researched credit card data.
 * Runs between research:cards and merge:cards to fix non-canonical
 * categories, malformed caps, and null values.
 *
 * Usage: npx tsx scripts/normalize-cards.ts [input-path] [output-path]
 * Defaults: reads and writes data/cards_draft.json
 */

const CATEGORY_MAP: Record<string, string | null> = {
  // Canonical categories (no change)
  general: "general",
  dining: "dining",
  grocery: "grocery",
  travel: "travel",
  hotels: "hotels",
  gas: "gas",
  transit: "transit",
  "online-shopping": "online-shopping",
  drugstores: "drugstores",
  "wholesale-clubs": "wholesale-clubs",
  streaming: "streaming",
  entertainment: "entertainment",

  // Non-canonical → canonical
  groceries: "grocery",
  flight: "travel",
  flights: "travel",
  airlines: "travel",
  "rental-cars": "travel",
  "car-rentals": "travel",
  "vacation-rentals": "hotels",
  "public-transit": "transit",
  rideshare: "transit",
  live_entertainment: "entertainment",

  // Cannot be represented statically → remove
  "rotating-quarters": null,
  quarterly: null,

  // Too niche for our engine → general
  home_improvement: "general",
  fitness: "general",
};

function normalizeCap(cap: any): { quarterly?: number; annual?: number } | undefined {
  if (!cap) return undefined;

  if (typeof cap === "number") {
    return { quarterly: cap };
  }

  if (typeof cap === "object") {
    if (cap.quarterly || cap.annual) {
      const result: any = {};
      if (typeof cap.quarterly === "number") result.quarterly = cap.quarterly;
      if (typeof cap.annual === "number") result.annual = cap.annual;
      return Object.keys(result).length > 0 ? result : undefined;
    }

    const amount = cap.amount ?? cap.value ?? cap.limit;
    if (typeof amount === "number") {
      const period = String(cap.period ?? cap.type ?? cap.frequency ?? cap.cap_period ?? "quarterly").toLowerCase();
      if (period.includes("annual") || period.includes("year")) {
        return { annual: amount };
      }
      return { quarterly: amount };
    }
  }

  return undefined;
}

function normalizeRewards(rewards: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [rawCategory, reward] of Object.entries(rewards)) {
    if (reward === null || reward === undefined) continue;

    const mapped = CATEGORY_MAP[rawCategory];
    if (mapped === undefined) {
      console.log(`    WARN: Unknown category "${rawCategory}" → general`);
    }

    const targetCategory = mapped === undefined ? "general" : mapped;
    if (targetCategory === null) {
      console.log(`    DROP: "${rawCategory}" (cannot represent statically)`);
      continue;
    }

    if (normalized[targetCategory]) {
      if ((reward.rate ?? 0) > (normalized[targetCategory].rate ?? 0)) {
        console.log(`    MERGE: "${rawCategory}" → "${targetCategory}" (keeping higher rate ${reward.rate})`);
        normalized[targetCategory] = { ...reward };
      } else {
        console.log(`    MERGE: "${rawCategory}" → "${targetCategory}" (keeping existing rate ${normalized[targetCategory].rate})`);
        continue;
      }
    } else {
      if (rawCategory !== targetCategory) {
        console.log(`    MAP: "${rawCategory}" → "${targetCategory}"`);
      }
      normalized[targetCategory] = { ...reward };
    }

    const entry = normalized[targetCategory];
    const cap = normalizeCap(entry.cap);
    if (cap) {
      entry.cap = cap;
    } else {
      delete entry.cap;
    }

    delete entry.cap_period;
  }

  return normalized;
}

function normalizeCard(card: any): any {
  const result = { ...card };

  if (result.rewards && typeof result.rewards === "object") {
    result.rewards = normalizeRewards(result.rewards);
  }

  if (Array.isArray(result.credits)) {
    result.credits = result.credits.map((c: any) => ({
      ...c,
      value: typeof c.value === "number" ? c.value : 0,
      usage_ease: typeof c.usage_ease === "number" ? c.usage_ease : 0.5,
      kind: VALID_CREDIT_KINDS.has(c.kind)
        ? c.kind
        : inferCreditKind({
            name: typeof c.name === "string" ? c.name : "",
            category: c.category,
            match: c.match,
          }),
    }));
  }

  if (Array.isArray(result.benefits)) {
    result.benefits = result.benefits.map((b: any) => ({
      ...b,
      value: typeof b.value === "number" ? b.value : 0,
      usage_ease: typeof b.usage_ease === "number" ? b.usage_ease : 0.5,
    }));
  }

  return result;
}

function main() {
  const inputPath = process.argv[2] || path.join(process.cwd(), "data", "cards_draft.json");
  const outputPath = process.argv[3] || inputPath;

  console.log(`\n=== Normalize Card Data ===\n`);
  console.log(`  Input:  ${inputPath}`);
  console.log(`  Output: ${outputPath}\n`);

  let data: Record<string, any>;
  try {
    data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  } catch (e: any) {
    console.error(`Failed to read/parse: ${e.message}`);
    process.exit(1);
  }

  const normalized: Record<string, any> = {};
  for (const [id, card] of Object.entries(data)) {
    console.log(`  ${card.institution_name || "?"} ${card.name || id}:`);
    normalized[id] = normalizeCard(card);
  }

  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2), "utf-8");
  console.log(`\n  Wrote ${Object.keys(normalized).length} cards to ${outputPath}\n`);
}

main();
