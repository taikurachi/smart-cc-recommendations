import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/connection";
import { creditCards as creditCardsTable } from "@/drizzle/schema";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(creditCardsTable);

    return NextResponse.json(rows, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error loading credit card data:", error);
    return NextResponse.json(
      { error: "Failed to load credit card data" },
      { status: 500 }
    );
  }
}
