// Install first: npm install react-plaid-link
"use client";
import { useState, useEffect, useRef } from "react";
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
  const [connectionMethod, setConnectionMethod] = useState<
    "plaid" | "csv" | null
  >(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // CSV Upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(
      (file) =>
        file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")
    );

    if (csvFile) {
      setUploadedFile(csvFile);
      setMessage(`📄 CSV file "${csvFile.name}" ready to process`);
    } else {
      setMessage("❌ Please upload a CSV file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setMessage(`📄 CSV file "${file.name}" ready to process`);
    }
  };

  const processCsvFile = async () => {
    if (!uploadedFile) {
      setMessage("❌ Please select a CSV file first");
      return;
    }

    setLoading(true);
    setMessage("🔄 Processing CSV file...");

    try {
      // Ensure user exists
      let currentUserId = user?.id;
      if (!currentUserId) {
        const userResponse = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: `csv-user-${Date.now()}@example.com` }),
        });
        const userData = await userResponse.json();
        setUser(userData.user);
        currentUserId = userData.user.id;
        localStorage.setItem("userId", currentUserId);
      }

      // Read and parse CSV file
      const text = await uploadedFile.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        throw new Error(
          "CSV file must have at least a header and one data row"
        );
      }

      // Parse CSV (basic implementation - you might want to use a proper CSV parser)
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const transactions = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length >= headers.length) {
          const transaction: any = {};
          headers.forEach((header, index) => {
            transaction[header] = values[index]?.trim() || "";
          });

          // Add some metadata
          transaction.transaction_id = `csv_${i}_${Date.now()}`;
          transaction.account_id = "csv_upload";

          transactions.push(transaction);
        }
      }

      setTransactions(transactions);
      setMessage(
        `✅ Successfully processed ${transactions.length} transactions from CSV`
      );

      // Create a mock connection for CSV data
      const mockConnection: Connection = {
        id: `csv_${Date.now()}`,
        item_id: `csv_${uploadedFile.name}`,
        institution_name: `CSV Upload (${uploadedFile.name})`,
        accounts: [
          {
            account_id: "csv_upload",
            name: "CSV Import",
            type: "depository",
            subtype: "checking",
          },
        ],
        created_at: new Date().toISOString(),
        last_synced: new Date().toISOString(),
      };

      setConnections((prev) => [...prev, mockConnection]);
    } catch (error) {
      console.error("CSV processing error:", error);
      setMessage(
        `❌ Error processing CSV: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const resetConnectionMethod = () => {
    setConnectionMethod(null);
    setUploadedFile(null);
    setMessage("");
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

      {/* Connection Method Selection */}
      {!connectionMethod && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Choose Your Connection Method
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Plaid API Option */}
            <div
              onClick={() => setConnectionMethod("plaid")}
              className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl p-8 cursor-pointer transition-all duration-200 hover:shadow-lg group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">
                  🏦 Connect via Plaid
                </h3>
                <p className="text-gray-600 mb-4">
                  Securely connect your bank account using Plaid's
                  industry-standard API. Real-time transaction data with
                  bank-level security.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Automatic transaction sync
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Bank-level encryption
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Real-time updates
                  </div>
                </div>
              </div>
            </div>

            {/* CSV Upload Option */}
            <div
              onClick={() => setConnectionMethod("csv")}
              className="bg-white border-2 border-gray-200 hover:border-green-400 rounded-xl p-8 cursor-pointer transition-all duration-200 hover:shadow-lg group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">
                  📄 Upload CSV File
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload your transaction data from a CSV file exported from
                  your bank or credit card company.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Manual data import
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    No bank connection required
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Historical data analysis
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plaid Connection Flow */}
      {connectionMethod === "plaid" && (
        <div className="bg-white border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🏦 Plaid Bank Connection</h2>
            <button
              onClick={resetConnectionMethod}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to options
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
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
        </div>
      )}

      {/* CSV Upload Flow */}
      {connectionMethod === "csv" && (
        <div className="bg-white border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📄 CSV File Upload</h2>
            <button
              onClick={resetConnectionMethod}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to options
            </button>
          </div>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${
                isDragOver
                  ? "border-green-400 bg-green-50"
                  : uploadedFile
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-4">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  uploadedFile ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {uploadedFile ? (
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                )}
              </div>

              {uploadedFile ? (
                <div>
                  <p className="text-lg font-medium text-green-700">
                    ✅ File Ready
                  </p>
                  <p className="text-sm text-gray-600">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Click to select a different file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drop your CSV file here
                  </p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports .csv files up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Process Button */}
          {uploadedFile && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={processCsvFile}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium"
              >
                {loading ? "⏳ Processing..." : "🚀 Process CSV File"}
              </button>
            </div>
          )}

          {/* CSV Format Help */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">
              📋 Expected CSV Format
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Your CSV should include columns like:
            </p>
            <div className="text-xs text-gray-500 font-mono bg-white p-2 rounded border">
              date, description, amount, category, account
            </div>
            <p className="text-xs text-gray-500 mt-2">
              The first row should contain column headers. Common formats from
              banks are supported.
            </p>
          </div>
        </div>
      )}

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
