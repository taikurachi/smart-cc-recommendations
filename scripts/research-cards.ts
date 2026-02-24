import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { validateCard, ValidationError } from "./validate-card";

// Load .env.local for OPENAI_API_KEY (Next.js convention)
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvLocal();

const TARGET_CARDS = [
  { name: "Sapphire Preferred", institution: "Chase" },
  { name: "Sapphire Reserve", institution: "Chase" },
  { name: "Freedom Flex", institution: "Chase" },
  { name: "Gold Card", institution: "American Express" },
  { name: "Blue Cash Preferred Card", institution: "American Express" },
  { name: "Blue Cash Everyday Card", institution: "American Express" },
  { name: "Venture X Rewards", institution: "Capital One" },
  { name: "SavorOne Cash Rewards", institution: "Capital One" },
  { name: "Quicksilver Cash Rewards", institution: "Capital One" },
  { name: "Double Cash Card", institution: "Citi" },
  { name: "Custom Cash Card", institution: "Citi" },
  { name: "it Cash Back", institution: "Discover" },
  { name: "Active Cash Card", institution: "Wells Fargo" },
  { name: "Altitude Go", institution: "US Bank" },
  { name: "Premium Rewards", institution: "Bank of America" },
];

const REFERENCE_CARD_EXAMPLE = `{
  "id": "chase_freedom_unlimited",
  "institution_name": "Chase",
  "name": "Freedom Unlimited",
  "annual_fee": 0,
  "tags": ["cashback", "travel", "beginner_friendly", "no_annual_fee"],
  "rewards": {
    "travel": { "rate": 0.05, "unit": "points" },
    "dining": { "rate": 0.03, "unit": "points" },
    "drugstores": { "rate": 0.03, "unit": "points" },
    "general": { "rate": 0.015, "unit": "points" }
  },
  "credits": [],
  "benefits": [
    { "name": "intro-bonus", "value": 200, "usage_ease": 1 },
    { "name": "no-foreign-transaction-fees", "value": 50, "usage_ease": 0.4 },
    { "name": "trip-cancellation-insurance", "value": 100, "usage_ease": 0.5 },
    { "name": "purchase-protection", "value": 50, "usage_ease": 0.6 },
    { "name": "auto-rental-collision", "value": 40, "usage_ease": 0.2 }
  ],
  "image": {
    "src": "",
    "alt": "Chase Freedom Unlimited® Image"
  }
}`;

const SYSTEM_PROMPT = `You are a credit card data researcher. Your job is to look up the CURRENT, ACCURATE details of a credit card using web search, then return a structured JSON object.

IMPORTANT RULES:
- Search the web for the most up-to-date information from the card issuer's official website.
- All reward rates must be expressed as DECIMALS: 5x points = 0.05, 3% cash back = 0.03, 1.5x = 0.015
- The "unit" field is "points" if the card earns points/miles, "cash" if it earns cash back percentage
- For "cap" on rewards: use "quarterly" for per-quarter spending caps, "annual" for per-year caps. The cap value is the DOLLAR amount of spending that earns the bonus rate. Omit "cap" entirely if there is no cap.
- "credits" are statement credits the card offers (e.g., Uber credit, dining credit, airline incidental credit). Each has a dollar "value" per year and "usage_ease" from 0 to 1 (0 = very hard to use / niche, 1 = automatic / everyone uses it). If the card has no credits, use an empty array [].
- "benefits" are non-credit perks (e.g., lounge access, travel insurance, purchase protection). Each has an estimated annual dollar "value" and "usage_ease" from 0 to 1. ALWAYS include "intro-bonus" as a benefit if the card has a sign-up bonus -- set "value" to the cash-equivalent value in dollars (for points bonuses, value points at $0.01 each).
- "tags" must be from this exact set: "travel", "cashback", "no_annual_fee", "beginner_friendly", "business", "low_interest". A card can have multiple tags. Use "no_annual_fee" only if annual_fee is 0.
- "id" should be a snake_case identifier like "chase_sapphire_preferred" or "amex_gold_card"
- Reward categories must be from: "general", "dining", "grocery", "travel", "hotels", "gas", "online-shopping", "drugstores", "wholesale-clubs", "streaming"
- For the "image" field, set "src" to an empty string "" and "alt" to the full card name with issuer.
- usage_ease guidelines: 1.0 = automatic/universal (e.g., cash back on all purchases), 0.8-0.9 = easy to use for most people (e.g., Uber credits, streaming credits), 0.5-0.7 = moderate effort (e.g., travel credits that require booking), 0.2-0.4 = niche or hard to use (e.g., specific airline credits, CLEAR membership), 0.1 = almost impossible to use

Here is a reference example of the exact output format:
${REFERENCE_CARD_EXAMPLE}

Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

async function researchCard(
  client: OpenAI,
  cardName: string,
  institution: string
): Promise<{ card: any; errors: ValidationError[] } | null> {
  const userPrompt = `Research the "${institution} ${cardName}" credit card. Search the web for its current annual fee, reward rates for all spending categories, any statement credits, benefits, and sign-up bonus. Return the structured JSON object.`;

  try {
    const response = await client.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search" as any }],
      input: [
        { role: "developer", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.output_text;
    if (!text) {
      console.error(`  No output for ${institution} ${cardName}`);
      return null;
    }

    let card: any;
    try {
      card = JSON.parse(text);
    } catch {
      // Try extracting JSON from possible markdown wrapping
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        card = JSON.parse(jsonMatch[0]);
      } else {
        console.error(`  Failed to parse JSON for ${institution} ${cardName}`);
        console.error(`  Raw output: ${text.slice(0, 200)}...`);
        return null;
      }
    }

    const errors = validateCard(card);
    return { card, errors };
  } catch (error: any) {
    console.error(`  API error for ${institution} ${cardName}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("\n=== Credit Card Research Pipeline ===\n");
  console.log(`Target: ${TARGET_CARDS.length} cards using OpenAI GPT with web search\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY not found.");
    console.error("Add it to .env.local:  OPENAI_API_KEY=sk-...");
    console.error("Or export it:          export OPENAI_API_KEY=sk-...");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const results: Record<string, any> = {};
  let succeeded = 0;
  let failed = 0;
  let warnings = 0;

  for (const { name, institution } of TARGET_CARDS) {
    process.stdout.write(`  Researching ${institution} ${name}...`);

    const result = await researchCard(client, name, institution);

    if (!result) {
      console.log(" FAILED (API/parse error)");
      failed++;
      continue;
    }

    if (result.errors.length === 0) {
      console.log(` OK (${institution} ${result.card.name})`);
      results[result.card.id] = result.card;
      succeeded++;
    } else {
      console.log(` WARNING (${result.errors.length} validation issues)`);
      result.errors.forEach((e) => console.log(`     - ${e.field}: ${e.message}`));
      results[result.card.id || `${institution}_${name}`.toLowerCase().replace(/\s+/g, "_")] = result.card;
      warnings++;
    }
  }

  // Write draft file
  const draftPath = path.join(process.cwd(), "data", "cards_draft.json");
  fs.writeFileSync(draftPath, JSON.stringify(results, null, 2), "utf-8");

  console.log("\n=== Summary ===\n");
  console.log(`  Succeeded:  ${succeeded}`);
  console.log(`  Warnings:   ${warnings} (saved but need review)`);
  console.log(`  Failed:     ${failed}`);
  console.log(`  Total:      ${TARGET_CARDS.length}`);
  console.log(`\n  Draft saved to: ${draftPath}`);
  console.log(`  Next steps:`);
  console.log(`    1. Review data/cards_draft.json against issuer websites`);
  console.log(`    2. Fix any issues manually`);
  console.log(`    3. Run: npm run validate:cards data/cards_draft.json`);
  console.log(`    4. Run: npm run merge:cards\n`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
