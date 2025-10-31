// Install first: npm install react-plaid-link
"use client";
import { useState, useEffect, useRef } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import { loadUserData } from "@/lib/userOperations";
import { User, Connection } from "@/lib/types";
import Image from "next/image";
import Button from "../components/Button";
import { AnimatePresence, motion } from "motion/react";
import { Check, X, Upload, CheckCircle, Loader } from "lucide-react";
import {
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleFileDelete,
  handleFileSelect,
  handleProcessCsvFile,
} from "@/lib/csvHandlers";
import {
  handleCreateLinkToken,
  handlePlaidSuccess,
  handlePlaidExit,
} from "@/lib/plaidHandlers";

const buttonStates = [
  { title: "Connect", icon: null, bgColor: "purple" },
  {
    title: "Creating Token",
    icon: <Loader size={15} className="animate-spin" />,
    bgColor: "gray",
  },
  { title: "Success", icon: <Check size={15} />, bgColor: "green" },
  { title: "Failed", icon: <X size={15} />, bgColor: "red" },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [linkToken, setLinkToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [fileIndex, setFileIndex] = useState(0);
  const [plaidStateIndex, setPlaidStateIndex] = useState(0);
  const [buttonStateIndex, setButtonStateIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      await handlePlaidSuccess(
        public_token,
        user?.id,
        setMessage,
        setLoading,
        loadData,
        router
      );
    },
    onExit: (err) => {
      handlePlaidExit(err, setMessage);
    },
  });
  const plaidStates = [
    {
      title: "Connect with Plaid",
      description: (
        <div className="text-sm space-y-2">
          <div className="flex">
            <Check size={15} className="text-green-600" />
            <span className="font-semibold ml-2">Automatic sync</span> -
            Real-time transaction updates
          </div>
          <div className="flex">
            <Check size={15} className="text-green-600" />
            <span className="font-semibold ml-2">Bank-level security</span> -
            256-bit encryption
          </div>
          <div className="flex">
            <Check size={15} className="text-green-600" />
            <span className="font-semibold ml-2">Always up-to-date</span> - No
            manual imports needed
          </div>
          <div className="flex">
            <Check size={15} className="text-green-600" />
            <span className="font-semibold ml-2">Fast setup</span> - Connect in
            under 60 seconds
          </div>
        </div>
      ),
      action: (
        <Button
          onClick={async () => {
            setButtonStateIndex((prev) => prev + 1);
            const token = await handleCreateLinkToken(
              user,
              setUser,
              setMessage
            );

            if (token) {
              setLinkToken(token);
              setButtonStateIndex((prev) => prev + 1);
            } else {
              // Skip the 3rd state
              setButtonStateIndex((prev) => prev + 2);
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));

            setPlaidStateIndex((prev) => prev + 1);
          }}
          color={buttonStates[buttonStateIndex].bgColor}
          className="overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={buttonStateIndex}
              className="flex gap-2 items-center"
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.1, ease: "easeInOut" }}
            >
              {buttonStates[buttonStateIndex].title}{" "}
              {buttonStates[buttonStateIndex].icon}
            </motion.div>
          </AnimatePresence>
        </Button>
      ),
    },
    {
      title: "Connect Bank Account",
      description:
        "Click the button below to open Plaid's secure connection window. You'll select your bank and log in with your credentials.",
      action: <Button onClick={open}>Connect Bank Account</Button>,
    },
    {
      title: "Success!🎉",
      description:
        "You've successfully connected your bank account! We're redirecting you to our dashboard now.",
      action: "plaid image",
    },
  ];
  // Load user data function
  const loadData = async () => {
    const data = await loadUserData();
    setUser(data.user);
  };

  // Load existing user data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Create interval animation for multiple uploaded files
  useEffect(() => {
    if (uploadedFiles.length === 0) return;

    const intervalId = setInterval(() => {
      setFileIndex((prev) => (prev + 1) % uploadedFiles.length);
    }, 1300);

    return () => clearInterval(intervalId);
  }, [uploadedFiles]);

  // CSV Upload handlers

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-semibold text-3xl text-center mb-2">
        Connect Your Financial Accounts
      </h1>
      <p className="text-center mb-8">
        Connect your bank through Plaid or upload transaction data
      </p>
      {/* Connection Method Selection */}
      <div className="mb-8">
        <div className="grid md:grid-cols-2 gap-6 sm:h-[400px] h-full">
          {/* Plaid API Option */}
          <div className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl p-8 transition-all duration-200 hover:shadow-lg group">
            <div className="flex flex-col gap-6">
              <Image
                src="/plaid-logo.svg"
                height={100}
                width={100}
                alt="Plaid logo"
              />
              <AnimatePresence mode="wait">
                <motion.h3
                  key={`title-${plaidStateIndex}`}
                  className="text-xl font-bold"
                  initial={{ filter: "blur(10px)", opacity: 0 }}
                  animate={{ filter: "blur(0px)", opacity: 1 }}
                  exit={{ filter: "blur(10px)", opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {plaidStates[plaidStateIndex].title}
                </motion.h3>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`description-${plaidStateIndex}`}
                  initial={{ filter: "blur(10px)", opacity: 0 }}
                  animate={{ filter: "blur(0px)", opacity: 1 }}
                  exit={{ filter: "blur(10px)", opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {plaidStates[plaidStateIndex].description}
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  className="mb-auto"
                  key={`description-${plaidStateIndex}`}
                  initial={{ filter: "blur(10px)", opacity: 0 }}
                  animate={{ filter: "blur(0px)", opacity: 1 }}
                  exit={{ filter: "blur(10px)", opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {plaidStates[plaidStateIndex].action}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* CSV Upload Option */}
          <div
            onDragOver={(e) => handleDragOver(e, setIsDragOver)}
            onDragLeave={(e) => handleDragLeave(e, setIsDragOver)}
            onDrop={(e) =>
              handleDrop(e, setIsDragOver, setUploadedFiles, setMessage)
            }
            className={`${
              uploadedFiles.length > 0 ? "bg-green-100" : "bg-white"
            } rounded-xl p-12 transition-all duration-200 group relative`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23333' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
            }}
          >
            {uploadedFiles.length > 0 && (
              <div
                className="right-[8%] absolute top-[8%] hover:scale-105 cursor-pointer"
                onClick={() => handleFileDelete(setUploadedFiles)}
              >
                <X size={20} />
              </div>
            )}
            <input
              multiple
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) =>
                handleFileSelect(e, setUploadedFiles, setMessage)
              }
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-8 h-full">
              {uploadedFiles.length > 0 && (
                <p className="relative">{`${uploadedFiles.length} files selected`}</p>
              )}
              {uploadedFiles.length > 0 ? (
                <CheckCircle size={50} className="text-green-600" />
              ) : (
                <Upload size={50} className="text-gray-400" />
              )}
              <p className="text-gray-700">
                {uploadedFiles.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={fileIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {uploadedFiles[fileIndex].name}
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  "Drag and drop your CSV file here, or"
                )}
              </p>
              {uploadedFiles.length > 0 ? (
                <Button
                  color="green"
                  onClick={() =>
                    handleProcessCsvFile(
                      uploadedFiles,
                      user,
                      setUser,
                      setMessage,
                      setLoading,
                      setConnections,
                      router
                    )
                  }
                >
                  {`Process CSV File${uploadedFiles.length > 1 ? "s" : ""}`}
                </Button>
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
