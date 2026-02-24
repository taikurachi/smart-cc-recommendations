import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      itemId,
      accessToken,
      account_ids,
      months = 12,
    } = await request.json();

    let finalAccessToken = accessToken;

    // If no access token provided, try to get it from storage
    if (!finalAccessToken) {
      if (itemId) {
        const connection = storage.getConnectionByItemId(itemId);
        if (connection) {
          finalAccessToken = connection.access_token;
        }
      } else if (userId) {
        const connections = storage.getConnectionsByUserId(userId);
        if (connections.length > 0) {
          // Use the most recent connection
          finalAccessToken = connections[connections.length - 1].access_token;
        }
      }
    }

    if (!finalAccessToken) {
      return NextResponse.json(
        {
          error:
            "No access token found. Please connect your bank account first.",
        },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Build options object - only include account_ids if provided
    const options: {
      count: number;
      account_ids?: string[];
    } = {
      count: 500,
    };

    // Only filter by account_ids if provided
    if (account_ids && Array.isArray(account_ids) && account_ids.length > 0) {
      options.account_ids = account_ids;
    }

    const startDateStr = startDate.toISOString().split("T")[0];

    let allTransactions: any[] = [];
    let accounts: any[] = [];
    let totalTransactions = 0;
    let requestId = "";

    const response = await plaidClient.transactionsGet({
      access_token: finalAccessToken,
      start_date: startDateStr,
      end_date: endDate,
      options,
    });

    allTransactions = response.data.transactions;
    accounts = response.data.accounts;
    totalTransactions = response.data.total_transactions;
    requestId = response.data.request_id;

    while (allTransactions.length < totalTransactions) {
      const paginatedResponse = await plaidClient.transactionsGet({
        access_token: finalAccessToken,
        start_date: startDateStr,
        end_date: endDate,
        options: {
          ...options,
          offset: allTransactions.length,
        },
      });
      allTransactions = allTransactions.concat(
        paginatedResponse.data.transactions
      );
    }

    // Update last synced timestamp if we have itemId
    if (itemId) {
      storage.updateLastSynced(itemId);
    } else {
      const connections = storage.getPlaidConnections();
      const connection = connections.find(
        (conn) => conn.access_token === finalAccessToken
      );
      if (connection) {
        storage.updateLastSynced(connection.item_id);
      }
    }

    return NextResponse.json({
      success: true,
      transactions: allTransactions,
      accounts,
      total_transactions: totalTransactions,
      request_id: requestId,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : "Unknown error";
    console.error("Transactions error:", errorMessage);

    // Handle specific Plaid errors
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { data?: { error_code?: string } } })
        .response?.data?.error_code === "string" &&
      (error as { response: { data: { error_code: string } } }).response.data
        .error_code === "ITEM_LOGIN_REQUIRED"
    ) {
      return NextResponse.json(
        { error: "Bank login required. Please reconnect your account." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
