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
  const [linkToken, setLinkToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [connections, setConnections] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing user data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await loadUserData();
    setUser(data.user);
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
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };
  const handleFileDelete = () => {
    setUploadedFile(null);
  };
  const handleProcessCsvFile = async () => {
    if (!uploadedFile) return;

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

      <h1 className="font-semibold text-3xl text-center mb-2">
        Connect Your Financial Accounts
      </h1>
      <p className="text-center mb-8">
        Connect your bank through Plaid or upload transaction data
      </p>
      {/* Connection Method Selection */}
      <div className="mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plaid API Option */}
          <div className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl p-8 cursor-pointer transition-all duration-200 hover:shadow-lg group">
            <div className="flex flex-col gap-6">
              <Image
                src="/plaid-logo.svg"
                height={100}
                width={100}
                alt="Plaid logo"
              />
              <h3 className="text-xl font-bold">Connect via Plaid</h3>
              <div className="text-sm space-y-2">
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
              <Button className="mt-6">Connect</Button>
            </div>
          </div>

          {/* CSV Upload Option */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`${
              uploadedFile ? "bg-green-300" : "bg-white"
            } rounded-xl p-12 cursor-pointer transition-all duration-200 group relative`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23333' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
            }}
          >
            {uploadedFile && (
              <div
                className="right-[8%] absolute top-[8%]"
                onClick={handleFileDelete}
              >
                <Icon name="close" size={20} />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-6 h-full">
              <Icon name={uploadedFile ? "circlecheck" : "upload"} size={50} />
              <p className="text-gray-700">
                {uploadedFile
                  ? uploadedFile.name
                  : "Drag and drop your CSV file here, or"}
              </p>

              {uploadedFile ? (
                <Button onClick={handleProcessCsvFile}>Process CSV File</Button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Browse Files
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
