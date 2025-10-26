import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { storage } from "@/lib/storage";

// GET /api/plaid/accounts - Get detailed account information including credit cards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const itemId = searchParams.get("itemId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter required" },
        { status: 400 }
      );
    }

    // Get user's connections
    const connections = storage.getConnectionsByUserId(userId);

    if (connections.length === 0) {
      return NextResponse.json({
        accounts: [],
        creditCards: [],
        message: "No connections found",
      });
    }

    interface AccountData {
      account_id: string;
      name: string;
      official_name: string;
      type: string;
      subtype: string;
      mask?: string | null;
      institution_name?: string;
      balances: {
        available: number | null;
        current: number | null;
        limit: number | null;
        iso_currency_code: string | null;
      };
    }

    interface CreditCardData extends AccountData {
      credit_limit?: number | null;
      current_balance?: number | null;
      available_credit?: number | null;
    }

    const allAccounts: AccountData[] = [];
    const creditCards: CreditCardData[] = [];

    // If itemId is specified, only fetch for that connection
    const connectionsToFetch = itemId
      ? connections.filter((c) => c.item_id === itemId)
      : connections;

    for (const connection of connectionsToFetch) {
      try {
        // Fetch full account details from Plaid
        const accountsResponse = await plaidClient.accountsGet({
          access_token: connection.access_token,
        });

        const accounts = accountsResponse.data.accounts;

        for (const account of accounts) {
          const accountData: AccountData = {
            account_id: account.account_id,
            name: account.name,
            official_name: account.official_name || account.name,
            type: account.type,
            subtype: account.subtype || "",
            mask: account.mask || undefined,
            institution_name: connection.institution_name,
            balances: {
              available: account.balances.available,
              current: account.balances.current,
              limit: account.balances.limit,
              iso_currency_code: account.balances.iso_currency_code,
            },
          };

          allAccounts.push(accountData);

          // Identify credit cards
          if (account.type === "credit") {
            creditCards.push({
              ...accountData,
              credit_limit: account.balances.limit,
              current_balance: account.balances.current,
              available_credit: account.balances.available,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error fetching accounts for connection ${connection.item_id}:`,
          error
        );
        // Continue with other connections
      }
    }

    return NextResponse.json({
      accounts: allAccounts,
      creditCards: creditCards,
      total_accounts: allAccounts.length,
      total_credit_cards: creditCards.length,
    });
  } catch (error) {
    console.error("Accounts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
