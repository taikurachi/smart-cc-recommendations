import { NextRequest, NextResponse } from "next/server";
import { CountryCode } from "plaid";
import { getPlaidClient } from "@/lib/plaid/client";
import { storage } from "@/lib/db/storage";

export async function POST(request: NextRequest) {
  try {
    const { publicToken, userId } = await request.json();

    if (!publicToken) {
      return NextResponse.json(
        { error: "Public token is required" },
        { status: 400 }
      );
    }

    const plaid = getPlaidClient();
    const exchangeResponse = await plaid.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = exchangeResponse.data;

    let institutionName = "Unknown Bank";
    let institutionId = "";
    let accounts: Array<{ account_id: string; name: string; type: string; subtype: string; mask?: string }> = [];

    try {
      const itemResponse = await plaid.itemGet({
        access_token: access_token,
      });

      if (itemResponse.data.item.institution_id) {
        institutionId = itemResponse.data.item.institution_id;

        const institutionResponse = await plaid.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });

        institutionName = institutionResponse.data.institution.name;
      }

      const accountsResponse = await plaid.accountsGet({
        access_token: access_token,
      });

      accounts = accountsResponse.data.accounts.map((account) => ({
        account_id: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype || "",
        mask: account.mask ?? undefined,
      }));
    } catch (error) {
      console.error("Error fetching institution/account details:", error);
    }

    let user = userId ? await storage.getUserById(userId) : null;
    if (!user) {
      user = await storage.createUser();
    }

    const connection = await storage.createPlaidConnection(
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
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error("Exchange error:", err.response?.data || err.message);
    return NextResponse.json(
      { error: "Failed to connect bank account" },
      { status: 500 }
    );
  }
}
