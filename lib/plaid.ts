import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
  basePath:
    PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SANDBOX_SECRET!,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
