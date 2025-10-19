import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";

export async function POST(request: NextRequest) {
  const { publicToken } = await request.json();

  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  return NextResponse.json({
    access_token: response.data.access_token,
    item_id: response.data.item_id,
  });
}
