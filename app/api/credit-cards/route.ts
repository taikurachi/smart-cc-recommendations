import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/connection";
import { creditCards as creditCardsTable } from "@/drizzle/schema";
import { withErrorHandler } from "@/lib/api/withErrorHandler";

export const GET = withErrorHandler(async () => {
  const db = getDb();
  const rows = await db.select().from(creditCardsTable);

  return NextResponse.json(rows, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}, "Failed to load credit card data");
