// Install first: npm install react-plaid-link
"use client";
import { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";

interface User {
  id: string;
  email?: string;
  created_at: string;
}

interface Connection {
  id: string;
  item_id: string;
  institution_name?: string;
  accounts: Array<{
    account_id: string;
    name: string;
    type: string;
    subtype: string;
    mask?: string;
  }>;
  created_at: string;
  last_synced?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [linkToken, setLinkToken] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load existing user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // For demo purposes, we'll use a hardcoded user ID
      // In a real app, this would come from authentication
      const userId = localStorage.getItem("userId");

      if (userId) {
        const response = await fetch(`/api/users?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setConnections(data.connections || []);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // 1. Create link token
  const createLinkToken = async () => {
    setLoading(true);
    setMessage("");

    try {
      let currentUserId = user?.id;

      // Create user if doesn't exist
      if (!currentUserId) {
        const userResponse = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: `user-${Date.now()}@example.com` }),
        });
        const userData = await userResponse.json();
        setUser(userData.user);
        currentUserId = userData.user.id;
        localStorage.setItem("userId", currentUserId);
      }

      const response = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create link token");
      }

      const { link_token } = await response.json();
      setLinkToken(link_token);
      setMessage("✅ Link token created! Now click 'Connect Bank Account'");
    } catch (error) {
      console.error("Error creating link token:", error);
      setMessage("❌ Failed to create link token");
    } finally {
      setLoading(false);
    }
  };

  // 2. Plaid Link component
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      setLoading(true);
      setMessage("🔄 Connecting your bank account...");

      try {
        // Exchange public token for access token and store connection
        const response = await fetch("/api/plaid/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken: public_token,
            userId: user?.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to connect bank account");
        }

        const data = await response.json();
        setMessage(`✅ ${data.message} Connected to ${data.institution_name}`);

        // Reload user data to show new connection
        await loadUserData();
      } catch (error) {
        console.error("Error connecting bank:", error);
        setMessage("❌ Failed to connect bank account");
      } finally {
        setLoading(false);
      }
    },
    onExit: (err) => {
      if (err) {
        console.error("Plaid Link exit error:", err);
        setMessage("❌ Bank connection cancelled or failed");
      }
    },
  });

  // 3. Get transactions
  const getTransactions = async (connectionId?: string) => {
    setLoading(true);
    setMessage("🔄 Fetching transactions...");

    try {
      const response = await fetch("/api/plaid/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          itemId: connectionId,
          months: 6, // Get last 6 months
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setMessage(`✅ Loaded ${data.transactions?.length || 0} transactions`);

      // Reload connections to update last_synced
      await loadUserData();
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setMessage("❌ Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🏦 Credit Card Analyzer</h1>

      {/* User Info */}
      {user && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">👤 User Info</h2>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Email:</strong> {user.email || "Not set"}
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(user.created_at).toLocaleString()}
          </p>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-blue-800">{message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={createLinkToken}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
        >
          {loading ? "⏳ Loading..." : "🔗 Create Link Token"}
        </button>

        <button
          onClick={open}
          disabled={!ready || !linkToken || loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
        >
          🏦 Connect Bank Account
        </button>

        <button
          onClick={() => getTransactions()}
          disabled={connections.length === 0 || loading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
        >
          📊 Get Transactions
        </button>
      </div>

      {/* Connected Banks */}
      {connections.length > 0 && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            🏦 Connected Banks ({connections.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {connections.map((conn) => (
              <div key={conn.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">
                    {conn.institution_name || "Unknown Bank"}
                  </h3>
                  <button
                    onClick={() => getTransactions(conn.item_id)}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                  >
                    Sync
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Connected: {new Date(conn.created_at).toLocaleDateString()}
                </p>
                {conn.last_synced && (
                  <p className="text-sm text-gray-600 mb-2">
                    Last synced: {new Date(conn.last_synced).toLocaleString()}
                  </p>
                )}
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">
                    Accounts ({conn.accounts.length}):
                  </p>
                  {conn.accounts.map((account) => (
                    <div
                      key={account.account_id}
                      className="text-sm text-gray-700 ml-2"
                    >
                      • {account.name} ({account.type}/{account.subtype})
                      {account.mask && (
                        <span className="text-gray-500">
                          {" "}
                          ****{account.mask}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            💳 Recent Transactions ({transactions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Merchant</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-left p-2">Account</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((t: any) => (
                  <tr
                    key={t.transaction_id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-2">{t.date}</td>
                    <td className="p-2 font-medium">{t.name}</td>
                    <td className="p-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {t.category?.[0] || "Other"}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono">
                      <span
                        className={
                          t.amount > 0 ? "text-red-600" : "text-green-600"
                        }
                      >
                        ${Math.abs(t.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-2 text-gray-600">
                      {t.account_id.slice(-4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length > 20 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing first 20 of {transactions.length} transactions
            </p>
          )}
        </div>
      )}

      {/* Getting Started */}
      {connections.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🚀 Getting Started</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click "Create Link Token" to initialize the connection</li>
            <li>Click "Connect Bank Account" to link your bank via Plaid</li>
            <li>Click "Get Transactions" to analyze your spending patterns</li>
          </ol>
        </div>
      )}
    </div>
  );
}
