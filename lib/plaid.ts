import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";

const plaidEnv = process.env.PLAID_ENV as keyof typeof PlaidEnvironments;
const plaidSecret = process.env.PLAID_SECRET ?? process.env.PLAID_SANDBOX_SECRET;

if (!plaidSecret) {
  throw new Error("Missing PLAID_SECRET or PLAID_SANDBOX_SECRET environment variable");
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

export const plaidClient = new PlaidApi(configuration);
