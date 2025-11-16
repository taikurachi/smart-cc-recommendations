import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import {
  CountryCode,
  Products,
  DepositoryAccountSubtype,
  CreditAccountSubtype,
} from "plaid";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Credit Card App",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      account_filters: {
        depository: {
          account_subtypes: [DepositoryAccountSubtype.Checking], // For debit cards
        },
        credit: {
          account_subtypes: [CreditAccountSubtype.CreditCard], // For credit cards
        },
      },
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    // This will show the actual Plaid error
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { data?: unknown } }).response?.data
        : "Unknown error";
    console.error("PLAID ERROR:", errorMessage);
    return NextResponse.json({ error: "Plaid error" }, { status: 500 });
  }
}
