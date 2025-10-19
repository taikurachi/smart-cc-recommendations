import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";

export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();

  // Get last 12 months of transactions
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate,
    options: {
      count: 500,
    },
  });

  return NextResponse.json({
    transactions: response.data.transactions,
    accounts: response.data.accounts,
  });
}
