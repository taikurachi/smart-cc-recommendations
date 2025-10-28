// Install first: npm install react-plaid-link
"use client";
import { useState, useEffect, useRef } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLinkToken, exchangePublicToken } from "@/lib/plaidOperations";
import { processCsvFile, validateCsvFile } from "@/lib/csvOperations";
import { loadUserData } from "@/lib/userOperations";
import { User, Connection } from "@/lib/types";
import Image from "next/image";
import Icon from "../components/Icon";
import Button from "../components/Button";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [linkToken, setLinkToken] = useState("");
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
    loadData();
  }, []);

  const loadData = async () => {
    const data = await loadUserData();
    setUser(data.user);
    setConnections(data.connections);
  };

  // 1. Create link token
  const handleCreateLinkToken = async () => {
    setLoading(true);
    setMessage("");

    const token = await createLinkToken(user, setUser, setMessage);
    if (token) {
      setLinkToken(token);
    }

    setLoading(false);
  };

  // 2. Plaid Link component
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      setLoading(true);
      setMessage("🔄 Connecting your bank account...");

      await exchangePublicToken(public_token, user?.id, setMessage, loadData);

      setLoading(false);

      // Redirect to analysis page after successful connection
      setTimeout(() => {
        router.push("/analysis");
      }, 1500); // Small delay to show success message
    },
    onExit: (err) => {
      if (err) {
        console.error("Plaid Link exit error:", err);
        setMessage("❌ Bank connection cancelled or failed");
      }
    },
  });

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
    const csvFile = files.find((file) => validateCsvFile(file));

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

  const handleProcessCsvFile = async () => {
    if (!uploadedFile) {
      setMessage("❌ Please select a CSV file first");
      return;
    }
    setLoading(true);

    const result = await processCsvFile(
      uploadedFile,
      user,
      setUser,
      setMessage
    );

    if (result) {
      setConnections((prev) => [...prev, result.connection]);

      // Redirect to analysis page after successful CSV processing
      setTimeout(() => {
        router.push("/analysis");
      }, 1500); // Small delay to show success message
    }

    setLoading(false);
  };

  const resetConnectionMethod = () => {
    setConnectionMethod(null);
    setUploadedFile(null);
    setMessage("");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Status Message */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-blue-800">{message}</p>
          {message.includes("Connected to") && (
            <div className="mt-3">
              <Link
                href="/analysis"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                📊 View Spending Analysis
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
      {/* Connection Method Selection */}
      {!connectionMethod && (
        <div className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Plaid API Option */}
            <div className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl p-8 cursor-pointer transition-all duration-200 hover:shadow-lg group">
              <div className="flex flex-col gap-4">
                <Image
                  src="/plaid-logo.svg"
                  height={100}
                  width={100}
                  alt="Plaid logo"
                />
                <h3 className="text-xl font-bold">Connect via Plaid</h3>

                <div className="text-sm space-y-1">
                  <div className="flex">
                    <Icon name="check" size={15} color="green" />
                    <span className="font-semibold ml-2">Automatic sync</span> -
                    Real-time transaction updates
                  </div>
                  <div className="flex">
                    <Icon name="check" size={15} color="green" />
                    <span className="font-semibold ml-2">
                      Bank-level security
                    </span>{" "}
                    - 256-bit encryption
                  </div>
                  <div className="flex">
                    <Icon name="check" size={15} color="green" />
                    <span className="font-semibold ml-2">
                      Always up-to-date
                    </span>{" "}
                    - No manual imports needed
                  </div>
                  <div className="flex">
                    <Icon name="check" size={15} color="green" />
                    <span className="font-semibold ml-2">Fast setup</span> -
                    Connect in under 60 seconds
                  </div>
                </div>
                <Button onClick={() => setConnectionMethod("plaid")}>
                  Connect
                </Button>
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
              onClick={handleCreateLinkToken}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
            >
              {loading ? "⏳ Loading..." : "🔗 Create Link Token"}
            </button>

            <button
              onClick={() => open()}
              disabled={!ready || !linkToken || loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
            >
              🏦 Connect Bank Account
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
            className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
              ${
                isDragOver
                  ? "border-green bg-green/5"
                  : uploadedFile
                  ? "border-green bg-green/5"
                  : "border-gray-300 hover:border-gray-400"
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

            {uploadedFile ? (
              <div className="space-y-4">
                <svg
                  className="w-16 h-16 mx-auto text-green"
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
                <div>
                  <p className="text-base font-medium text-gray-700 mb-1">
                    {uploadedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">File ready to upload</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-purple hover:text-purple-dark font-medium"
                >
                  Choose Different File
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400"
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
                <div>
                  <p className="text-base text-gray-700 mb-1">
                    Drag and drop your CSV file here, or
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Process Button */}
          {uploadedFile && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleProcessCsvFile}
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
                <h3 className="font-semibold text-lg mb-2">
                  {conn.institution_name || "Unknown Bank"}
                </h3>
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
      {/* Getting Started */}
      {connections.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🚀 Getting Started</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>
              Click &quot;Create Link Token&quot; to initialize the connection
            </li>
            <li>
              Click &quot;Connect Bank Account&quot; to link your bank via Plaid
            </li>
            <li>
              Click &quot;Get Transactions&quot; to analyze your spending
              patterns
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
