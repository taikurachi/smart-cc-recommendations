import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> | null {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) return null;

  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export function hasDb(): boolean {
  return !!process.env.DATABASE_URL;
}
