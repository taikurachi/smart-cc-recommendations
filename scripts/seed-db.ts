import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";

// Load .env.local
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

async function main() {
  console.log("\n=== Seed Postgres Database ===\n");

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Error: DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  // --- Seed credit cards from manualcc.json ---
  const ccPath = path.join(process.cwd(), "data", "manualcc.json");
  if (fs.existsSync(ccPath)) {
    const ccData = JSON.parse(fs.readFileSync(ccPath, "utf-8"));
    const cards = Object.values(ccData) as any[];

    console.log(`  Seeding ${cards.length} credit cards...`);
    let upserted = 0;

    for (const card of cards) {
      try {
        const values = {
          id: card.id,
          name: card.name,
          institution_name: card.institution_name,
          annual_fee: card.annual_fee,
          tags: card.tags,
          rewards: card.rewards,
          credits: card.credits || [],
          benefits: card.benefits || [],
          image: card.image || null,
        };
        await db
          .insert(schema.creditCards)
          .values(values)
          .onConflictDoUpdate({
            target: schema.creditCards.id,
            set: {
              name: values.name,
              institution_name: values.institution_name,
              annual_fee: values.annual_fee,
              tags: values.tags,
              rewards: values.rewards,
              credits: values.credits,
              benefits: values.benefits,
              image: values.image,
              updated_at: new Date(),
            },
          });
        upserted++;
      } catch (e: any) {
        console.error(`    Error upserting ${card.id}: ${e.message}`);
      }
    }
    console.log(`    Upserted: ${upserted}`);
  } else {
    console.log("  No manualcc.json found, skipping credit cards.");
  }

  // --- Seed users from users.json ---
  const usersPath = path.join(process.cwd(), "data", "users.json");
  if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, "utf-8")) as any[];
    if (users.length > 0) {
      console.log(`  Seeding ${users.length} users...`);
      for (const user of users) {
        try {
          await db
            .insert(schema.users)
            .values({
              id: user.id,
              email: user.email || null,
            })
            .onConflictDoNothing();
        } catch {
          // skip duplicates
        }
      }
      console.log(`    Done.`);
    }
  }

  // --- Seed plaid connections from plaid_connections.json ---
  const connsPath = path.join(process.cwd(), "data", "plaid_connections.json");
  if (fs.existsSync(connsPath)) {
    const conns = JSON.parse(fs.readFileSync(connsPath, "utf-8")) as any[];
    if (conns.length > 0) {
      console.log(`  Seeding ${conns.length} Plaid connections...`);
      for (const conn of conns) {
        try {
          await db
            .insert(schema.plaidConnections)
            .values({
              id: conn.id,
              user_id: conn.user_id,
              access_token: conn.access_token,
              item_id: conn.item_id,
              institution_name: conn.institution_name || null,
              institution_id: conn.institution_id || null,
              accounts: conn.accounts || [],
              last_synced: conn.last_synced ? new Date(conn.last_synced) : null,
              is_active: conn.is_active ?? true,
            })
            .onConflictDoNothing();
        } catch {
          // skip duplicates
        }
      }
      console.log(`    Done.`);
    }
  }

  console.log("\n  Seed complete.\n");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
