"use client";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Upload,
  CheckCircle,
  Info,
  Loader,
  Check,
  XCircle,
} from "lucide-react";
import Button from "@/app/components/Button";
import { User, Connection, Transaction } from "@/lib/types";
import {
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleFileDelete,
  handleFileSelect,
  handleParseCsvFile,
  handleConfirmTransactions,
} from "@/lib/csvHandlers";
import InfoModal from "./InfoModal";
import TransactionReviewModal from "./TransactionReviewModal";

interface CSVUploadCardProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setLoading: (loading: boolean) => void;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  router: { push: (path: string) => void };
  disabled?: boolean;
}

const buttonStates = [
  { title: "Process CSV Files", icon: null, bgColor: "green" },
  {
    title: "Processing",
    icon: <Loader size={15} className="animate-spin" />,
    bgColor: "gray",
  },
  { title: "Success", icon: <Check size={15} />, bgColor: "green" },
  { title: "Fail", icon: <X size={15} />, bgColor: "red" },
];

export default function CSVUploadCard({
  user,
  setUser,
  setLoading,
  setConnections,
  router,
  disabled = false,
}: CSVUploadCardProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileIndex, setFileIndex] = useState(0);
  const [, setIsDragOver] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>(
    []
  );
  const [parsedConnections, setParsedConnections] = useState<Connection[]>([]);
  const [buttonStateIndex, setButtonStateIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to determine background color
  const getBackgroundColor = () => {
    if (uploadedFiles.length === 0) return "bg-white";
    return buttonStateIndex === 3 ? "bg-red-200" : "bg-green-100";
  };

  const getIcon = () => {
    if (uploadedFiles.length === 0)
      return <Upload size={50} className="text-gray-400" />;

    return buttonStateIndex === 3 ? (
      <XCircle size={50} className="text-red-500" />
    ) : (
      <CheckCircle size={50} className="text-green-600" />
    );
  };

  // Create interval animation for multiple uploaded files
  useEffect(() => {
    if (uploadedFiles.length === 0) return;

    const intervalId = setInterval(() => {
      setFileIndex((prev) => (prev + 1) % uploadedFiles.length);
    }, 1300);

    return () => clearInterval(intervalId);
  }, [uploadedFiles]);

  return (
    <div
      onDragOver={(e) => !disabled && handleDragOver(e, setIsDragOver)}
      onDragLeave={(e) => !disabled && handleDragLeave(e, setIsDragOver)}
      onDrop={(e) =>
        !disabled && handleDrop(e, setIsDragOver, setUploadedFiles)
      }
      className={`${getBackgroundColor()} rounded-xl p-8 transition-all duration-200 group relative ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
      style={{
        backgroundImage: disabled
          ? undefined
          : `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23333' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
      }}
    >
      {disabled && (
        <div className="absolute inset-0 bg-gray-100/50 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-xl">
          <div className="bg-white rounded-lg p-4 shadow-lg max-w-xs">
            <p className="font-bold text-xl p-2">Method Locked</p>
            <p className="text-sm text-gray-600 p-2">
              You&apos;re using Plaid connection. All accounts must use the same
              connection method. Delete all Plaid connections, before manual.{" "}
              <span
                className="underline cursor-pointer
                
              "
                onClick={() => {
                  router.push("/manage");
                }}
              >
                Manage ↗
              </span>
            </p>
          </div>
        </div>
      )}
      {uploadedFiles.length > 0 ? (
        <X
          size={25}
          onClick={() => {
            handleFileDelete(setUploadedFiles);
            setFileIndex(0);
            setButtonStateIndex(0);
            if (fileInputRef.current) {
              fileInputRef.current.value = ""; // Reset file input
            }
          }}
          className="absolute justify-self-end hover:scale-110 cursor-pointer"
        />
      ) : (
        <Info
          size={25}
          onClick={() => setInfoModalOpen(true)}
          className="absolute justify-self-end  hover:scale-110 cursor-pointer"
        />
      )}

      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      <input
        multiple
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => !disabled && handleFileSelect(e, setUploadedFiles)}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center gap-8 h-full">
        {getIcon()}
        <p className="text-gray-700">
          {uploadedFiles.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.span
                key={fileIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
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
            color={buttonStates[buttonStateIndex].bgColor}
            onClick={async () => {
              if (disabled || buttonStateIndex > 0) return; // Prevent multiple clicks or disabled state

              setButtonStateIndex(1); // Set to "Processing"
              const result = await handleParseCsvFile(
                uploadedFiles,
                user,
                setUser,
                setLoading
              );

              if (result) {
                setButtonStateIndex(2); // Set to "Success"
                setParsedTransactions(result.transactions);
                setParsedConnections(result.connections);
                setReviewModalOpen(true);
              } else {
                setButtonStateIndex(3); // Set to "Fail"
              }
            }}
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
        ) : (
          <button
            onClick={(e) => {
              if (disabled) return;
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={disabled}
            className={`px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
              disabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Browse Files
          </button>
        )}
      </div>

      {/* Transaction Review Modal */}
      <TransactionReviewModal
        isOpen={reviewModalOpen}
        transactions={parsedTransactions}
        onConfirm={(editedTransactions) => {
          // Set connection method to 'manual'
          localStorage.setItem("connectionMethod", "manual");

          handleConfirmTransactions(
            editedTransactions,
            parsedConnections,
            setConnections,
            router
          );
          setReviewModalOpen(false);
          setUploadedFiles([]);
          setButtonStateIndex(0); // Reset button state
          if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
          }
        }}
        onClose={() => {
          setReviewModalOpen(false);
          setUploadedFiles([]);
          setButtonStateIndex(0); // Reset button state
          if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
          }
        }}
      />
    </div>
  );
}
