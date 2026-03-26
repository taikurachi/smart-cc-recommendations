import { NextRequest, NextResponse } from "next/server";
import { getMultiCardRecommendations } from "@/lib/recommendation";
import { withErrorHandler } from "@/lib/api/withErrorHandler";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { transactions, preferences, ownedCards, ownedCardsAnnualValue } = body;

  if (!transactions || !Array.isArray(transactions)) {
    return NextResponse.json(
      { error: "transactions array is required" },
      { status: 400 },
    );
  }

  const result = await getMultiCardRecommendations(
    transactions,
    preferences ?? {},
    ownedCards ?? [],
    ownedCardsAnnualValue,
  );

  return NextResponse.json(result);
}, "Failed to compute recommendations");
