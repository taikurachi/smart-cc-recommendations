"use client";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Upload, CheckCircle, Info } from "lucide-react";
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
  setMessage: (message: string) => void;
  setLoading: (loading: boolean) => void;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  router: { push: (path: string) => void };
}

export default function CSVUploadCard({
  user,
  setUser,
  setMessage,
  setLoading,
  setConnections,
  router,
}: CSVUploadCardProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileIndex, setFileIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>(
    []
  );
  const [parsedConnections, setParsedConnections] = useState<Connection[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onDragOver={(e) => handleDragOver(e, setIsDragOver)}
      onDragLeave={(e) => handleDragLeave(e, setIsDragOver)}
      onDrop={(e) => handleDrop(e, setIsDragOver, setUploadedFiles, setMessage)}
      className={`${
        uploadedFiles.length > 0 ? "bg-green-100" : "bg-white"
      } rounded-xl p-8 transition-all duration-200 group relative`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23333' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
      }}
    >
      {uploadedFiles.length > 0 ? (
        <X
          size={25}
          onClick={() => handleFileDelete(setUploadedFiles)}
          className="absolute justify-self-end over:scale-110 cursor-pointer"
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
        onChange={(e) => handleFileSelect(e, setUploadedFiles, setMessage)}
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
            color="green"
            onClick={async () => {
              const result = await handleParseCsvFile(
                uploadedFiles,
                user,
                setUser,
                setMessage,
                setLoading
              );

              if (result) {
                setParsedTransactions(result.transactions);
                setParsedConnections(result.connections);
                setReviewModalOpen(true);
              }
            }}
          >
            {`Parse CSV File${uploadedFiles.length > 1 ? "s" : ""}`}
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

      {/* Transaction Review Modal */}
      <TransactionReviewModal
        isOpen={reviewModalOpen}
        transactions={parsedTransactions}
        onConfirm={() => {
          handleConfirmTransactions(
            parsedTransactions,
            parsedConnections,
            setConnections,
            router
          );
          setReviewModalOpen(false);
          setUploadedFiles([]);
        }}
        onEdit={() => {
          // TODO: Implement edit functionality
          alert("Edit functionality coming soon!");
        }}
        onClose={() => {
          setReviewModalOpen(false);
        }}
      />
    </div>
  );
}
