/**
 * Plaid API client with lazy initialization.
 * The client is created on first use, avoiding import-time throws
 * when env vars are missing (e.g., in tests or scripts).
 */

import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";

let _client: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (!_client) {
    const plaidEnv = process.env.PLAID_ENV as keyof typeof PlaidEnvironments;
    const plaidSecret =
      process.env.PLAID_SECRET ?? process.env.PLAID_SANDBOX_SECRET;

    if (!plaidSecret) {
      throw new Error(
        "Missing PLAID_SECRET or PLAID_SANDBOX_SECRET environment variable"
      );
    }

    const configuration = new Configuration({
      basePath: PlaidEnvironments[plaidEnv],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
          "PLAID-SECRET": plaidSecret,
        },
      },
    });

    _client = new PlaidApi(configuration);
  }

  return _client;
}
