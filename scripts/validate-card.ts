import * as fs from "fs";
import * as path from "path";
import { creditKinds } from "../lib/recommendation/types";

const VALID_TAGS = new Set([
  "travel",
  "cashback",
  "no_annual_fee",
  "beginner_friendly",
  "business",
  "low_interest",
]);

const VALID_REWARD_CATEGORIES = new Set([
  "general",
  "dining",
  "grocery",
  "travel",
  "hotels",
  "gas",
  "transit",
  "online-shopping",
  "drugstores",
  "wholesale-clubs",
  "streaming",
  "entertainment",
]);

const VALID_UNITS = new Set(["points", "cash"]);
const VALID_CREDIT_KINDS = new Set(creditKinds);

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCard(card: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!card || typeof card !== "object") {
    return [{ field: "root", message: "Card must be a non-null object" }];
  }

  // Required string fields
  for (const field of ["id", "name", "institution_name"] as const) {
    if (typeof card[field] !== "string" || card[field].trim() === "") {
      errors.push({ field, message: `Must be a non-empty string` });
    }
  }

  // annual_fee
  if (typeof card.annual_fee !== "number" || card.annual_fee < 0) {
    errors.push({
      field: "annual_fee",
      message: `Must be a non-negative number, got ${card.annual_fee}`,
    });
  }

  // tags
  if (!Array.isArray(card.tags)) {
    errors.push({ field: "tags", message: "Must be an array" });
  } else {
    card.tags.forEach((tag: any, i: number) => {
      if (!VALID_TAGS.has(tag)) {
        errors.push({
          field: `tags[${i}]`,
          message: `Unknown tag "${tag}". Valid: ${[...VALID_TAGS].join(", ")}`,
        });
      }
    });
  }

  // rewards
  if (!card.rewards || typeof card.rewards !== "object") {
    errors.push({ field: "rewards", message: "Must be an object" });
  } else {
    Object.entries(card.rewards).forEach(([category, reward]: [string, any]) => {
      if (!VALID_REWARD_CATEGORIES.has(category)) {
        errors.push({
          field: `rewards.${category}`,
          message: `Unknown reward category. Valid: ${[...VALID_REWARD_CATEGORIES].join(", ")}`,
        });
      }
      if (typeof reward?.rate !== "number" || reward.rate < 0 || reward.rate > 0.10) {
        errors.push({
          field: `rewards.${category}.rate`,
          message: `Rate must be 0-0.10 (0-10%), got ${reward?.rate}`,
        });
      }
      if (!VALID_UNITS.has(reward?.unit)) {
        errors.push({
          field: `rewards.${category}.unit`,
          message: `Unit must be "points" or "cash", got "${reward?.unit}"`,
        });
      }
      if (reward?.cap) {
        if (reward.cap.quarterly !== undefined && (typeof reward.cap.quarterly !== "number" || reward.cap.quarterly <= 0)) {
          errors.push({
            field: `rewards.${category}.cap.quarterly`,
            message: `Quarterly cap must be a positive number`,
          });
        }
        if (reward.cap.annual !== undefined && (typeof reward.cap.annual !== "number" || reward.cap.annual <= 0)) {
          errors.push({
            field: `rewards.${category}.cap.annual`,
            message: `Annual cap must be a positive number`,
          });
        }
      }
    });
  }

  // credits
  if (!Array.isArray(card.credits)) {
    errors.push({ field: "credits", message: "Must be an array" });
  } else {
    card.credits.forEach((credit: any, i: number) => {
      if (typeof credit?.name !== "string" || credit.name.trim() === "") {
        errors.push({ field: `credits[${i}].name`, message: "Must be a non-empty string" });
      }
      if (typeof credit?.value !== "number" || credit.value < 0) {
        errors.push({ field: `credits[${i}].value`, message: `Must be non-negative, got ${credit?.value}` });
      }
      if (typeof credit?.usage_ease !== "number" || credit.usage_ease < 0 || credit.usage_ease > 1) {
        errors.push({ field: `credits[${i}].usage_ease`, message: `Must be 0-1, got ${credit?.usage_ease}` });
      }
      if (!VALID_CREDIT_KINDS.has(credit?.kind)) {
        errors.push({
          field: `credits[${i}].kind`,
          message: `Must be one of ${[...VALID_CREDIT_KINDS].join(", ")}, got ${credit?.kind}`,
        });
      }
      if (credit?.category !== undefined && !VALID_REWARD_CATEGORIES.has(credit.category)) {
        errors.push({ field: `credits[${i}].category`, message: `Unknown category "${credit.category}". Valid: ${[...VALID_REWARD_CATEGORIES].join(", ")}` });
      }
      if (credit?.match !== undefined && (!credit.match || typeof credit.match !== "object" || Array.isArray(credit.match))) {
        errors.push({ field: `credits[${i}].match`, message: "Must be an object" });
      }
      if (credit?.match?.keywords !== undefined) {
        if (!Array.isArray(credit.match.keywords)) {
          errors.push({ field: `credits[${i}].match.keywords`, message: "Must be an array of non-empty strings" });
        } else {
          credit.match.keywords.forEach((keyword: any, j: number) => {
            if (typeof keyword !== "string" || keyword.trim() === "") {
              errors.push({
                field: `credits[${i}].match.keywords[${j}]`,
                message: "Must be a non-empty string",
              });
            }
          });
        }
      }
    });
  }

  // benefits
  if (!Array.isArray(card.benefits)) {
    errors.push({ field: "benefits", message: "Must be an array" });
  } else {
    card.benefits.forEach((benefit: any, i: number) => {
      if (typeof benefit?.name !== "string" || benefit.name.trim() === "") {
        errors.push({ field: `benefits[${i}].name`, message: "Must be a non-empty string" });
      }
      if (typeof benefit?.value !== "number" || benefit.value < 0) {
        errors.push({ field: `benefits[${i}].value`, message: `Must be non-negative, got ${benefit?.value}` });
      }
      if (typeof benefit?.usage_ease !== "number" || benefit.usage_ease < 0 || benefit.usage_ease > 1) {
        errors.push({ field: `benefits[${i}].usage_ease`, message: `Must be 0-1, got ${benefit?.usage_ease}` });
      }
      if (benefit?.category !== undefined && !VALID_REWARD_CATEGORIES.has(benefit.category)) {
        errors.push({ field: `benefits[${i}].category`, message: `Unknown category "${benefit.category}". Valid: ${[...VALID_REWARD_CATEGORIES].join(", ")}` });
      }
    });
  }

  // image
  if (!card.image || typeof card.image !== "object") {
    errors.push({ field: "image", message: "Must be an object with src and alt" });
  } else {
    if (typeof card.image.src !== "string") {
      errors.push({ field: "image.src", message: "Must be a string" });
    }
    if (typeof card.image.alt !== "string") {
      errors.push({ field: "image.alt", message: "Must be a string" });
    }
  }

  return errors;
}

/**
 * Validate a file of cards (object keyed by card ID).
 * Run standalone: npx tsx scripts/validate-card.ts [path]
 */
if (require.main === module) {
  const filePath = process.argv[2] || path.join(process.cwd(), "data", "manualcc.json");
  console.log(`\nValidating: ${filePath}\n`);

  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e: any) {
    console.error(`Failed to read/parse file: ${e.message}`);
    process.exit(1);
  }

  const cards = typeof data === "object" && !Array.isArray(data) ? Object.values(data) : data;
  let totalErrors = 0;

  (cards as any[]).forEach((card: any) => {
    const errors = validateCard(card);
    if (errors.length === 0) {
      console.log(`  ✅ ${card.institution_name || "?"} ${card.name || card.id || "unknown"}`);
    } else {
      totalErrors += errors.length;
      console.log(`  ❌ ${card.institution_name || "?"} ${card.name || card.id || "unknown"} (${errors.length} errors)`);
      errors.forEach((e) => console.log(`     - ${e.field}: ${e.message}`));
    }
  });

  console.log(`\nTotal: ${cards.length} cards | Errors: ${totalErrors}\n`);
  if (totalErrors > 0) process.exit(1);
}
