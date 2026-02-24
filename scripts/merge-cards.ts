import * as fs from "fs";
import * as path from "path";
import { validateCard } from "./validate-card";

const MANUALCC_PATH = path.join(process.cwd(), "data", "manualcc.json");
const DRAFT_PATH = process.argv[2] || path.join(process.cwd(), "data", "cards_draft.json");

function main() {
  console.log("\n=== Merge Cards into manualcc.json ===\n");

  // Load existing production data
  let existing: Record<string, any>;
  try {
    existing = JSON.parse(fs.readFileSync(MANUALCC_PATH, "utf-8"));
  } catch {
    console.log("  No existing manualcc.json found, starting fresh.");
    existing = {};
  }

  // Load draft data
  let draft: Record<string, any>;
  try {
    draft = JSON.parse(fs.readFileSync(DRAFT_PATH, "utf-8"));
  } catch (e: any) {
    console.error(`  Failed to read draft file: ${DRAFT_PATH}`);
    console.error(`  ${e.message}`);
    process.exit(1);
  }

  const existingIds = new Set(Object.keys(existing));
  let added = 0;
  let skipped = 0;
  let validationFailed = 0;

  for (const [id, card] of Object.entries(draft)) {
    // Skip cards that already exist in production
    if (existingIds.has(id)) {
      console.log(`  SKIP ${card.institution_name} ${card.name} (already exists)`);
      skipped++;
      continue;
    }

    // Validate before merging
    const errors = validateCard(card);
    if (errors.length > 0) {
      console.log(`  FAIL ${card.institution_name || "?"} ${card.name || id} (${errors.length} validation errors)`);
      errors.forEach((e) => console.log(`     - ${e.field}: ${e.message}`));
      validationFailed++;
      continue;
    }

    existing[id] = card;
    console.log(`  ADD  ${card.institution_name} ${card.name}`);
    added++;
  }

  // Write updated manualcc.json
  fs.writeFileSync(MANUALCC_PATH, JSON.stringify(existing, null, 2), "utf-8");

  console.log("\n=== Summary ===\n");
  console.log(`  Added:             ${added}`);
  console.log(`  Skipped (exists):  ${skipped}`);
  console.log(`  Failed validation: ${validationFailed}`);
  console.log(`  Total in draft:    ${Object.keys(draft).length}`);
  console.log(`  Total in production: ${Object.keys(existing).length}`);
  console.log(`\n  Updated: ${MANUALCC_PATH}\n`);

  if (validationFailed > 0) {
    console.log("  Fix validation errors in the draft file and re-run.\n");
    process.exit(1);
  }
}

main();
