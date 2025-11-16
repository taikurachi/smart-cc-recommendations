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

    const response = await plaidClient.transactionsGet({
      access_token: finalAccessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate,
      options,
    });

    // Update last synced timestamp if we have itemId
    if (itemId) {
      storage.updateLastSynced(itemId);
    } else {
      // Try to find itemId from access token by checking stored connections
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
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      total_transactions: response.data.total_transactions,
      request_id: response.data.request_id,
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
