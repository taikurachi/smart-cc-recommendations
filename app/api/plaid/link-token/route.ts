import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { CountryCode, Products } from "plaid";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Credit Card App",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    // This will show the actual Plaid error
    console.error("PLAID ERROR:", error.response?.data || error.message);
    return NextResponse.json({ error: "Plaid error" }, { status: 500 });
  }
}
