import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const { publicToken, userId } = await request.json();

    if (!publicToken) {
      return NextResponse.json(
        { error: "Public token is required" },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Get institution info
    let institutionName = "Unknown Bank";
    let institutionId = "";
    let accounts: any[] = [];

    try {
      // Get item details to fetch institution info
      const itemResponse = await plaidClient.itemGet({
        access_token: access_token,
      });

      if (itemResponse.data.item.institution_id) {
        institutionId = itemResponse.data.item.institution_id;

        // Get institution details
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ["US"],
        });

        institutionName = institutionResponse.data.institution.name;
      }

      // Get accounts
      const accountsResponse = await plaidClient.accountsGet({
        access_token: access_token,
      });

      accounts = accountsResponse.data.accounts.map((account) => ({
        account_id: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype || "",
        mask: account.mask,
      }));
    } catch (error) {
      console.error("Error fetching institution/account details:", error);
      // Continue without institution details
    }

    // Ensure user exists or create one
    let user = userId ? storage.getUserById(userId) : null;
    if (!user) {
      user = storage.createUser();
    }

    // Store the Plaid connection
    const connection = storage.createPlaidConnection(
      user.id,
      access_token,
      item_id,
      institutionName,
      institutionId,
      accounts
    );

    return NextResponse.json({
      success: true,
      user_id: user.id,
      connection_id: connection.id,
      item_id: item_id,
      institution_name: institutionName,
      accounts: accounts,
      message: "Bank account connected successfully!",
    });
  } catch (error: any) {
    console.error("Exchange error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to connect bank account" },
      { status: 500 }
    );
  }
}
