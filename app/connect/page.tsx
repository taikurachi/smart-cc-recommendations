// Install first: npm install react-plaid-link
"use client";
import { useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function Home() {
  const [accessToken, setAccessToken] = useState("");
  const [linkToken, setLinkToken] = useState("");
  const [transactions, setTransactions] = useState([]);

  // 1. Create link token
  const createLinkToken = async () => {
    const response = await fetch("/api/plaid/link-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user123" }),
    });
    const { link_token } = await response.json();
    setLinkToken(link_token);
  };

  // 2. Plaid Link component
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      // Exchange public token for access token
      const response = await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken: public_token }),
      });
      const { access_token } = await response.json();
      setAccessToken(access_token);
    },
  });
  console.log(transactions);
  // 3. Get transactions
  const getTransactions = async () => {
    const response = await fetch("/api/plaid/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const { transactions } = await response.json();
    setTransactions(transactions);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Credit Card Analyzer</h1>

      <button
        onClick={createLinkToken}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
      >
        1. Create Link Token
      </button>

      <button
        onClick={open}
        disabled={!ready || !linkToken}
        className="bg-green-500 text-white px-4 py-2 rounded mr-4"
      >
        2. Connect Bank Account
      </button>

      <button
        onClick={getTransactions}
        disabled={!accessToken}
        className="bg-purple-500 text-white px-4 py-2 rounded"
      >
        3. Get Transactions
      </button>

      {transactions.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-bold">Your Transactions:</h2>
          {transactions.slice(0, 10).map((t: any) => (
            <div key={t.transaction_id} className="border p-2 my-2">
              <strong>${t.amount}</strong> at {t.name} on {t.date}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
