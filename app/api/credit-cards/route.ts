import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { creditCards as creditCardsTable } from "@/drizzle/schema";

export async function GET() {
  try {
    // Try database first
    const db = getDb();
    if (db) {
      const rows = await db.select().from(creditCardsTable);
      if (rows.length > 0) {
        return NextResponse.json(rows, {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      }
    }

    // Fall back to JSON file
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(process.cwd(), "data", "manualcc.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContents);

    return NextResponse.json(data, {
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
