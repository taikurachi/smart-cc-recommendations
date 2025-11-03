import { processCsvFile, validateCsvFile } from "./csvOperations";
import { User, Connection, Transaction } from "./types";

export const handleDragOver = (
  e: React.DragEvent,
  setIsDragOver: (value: boolean) => void
) => {
  e.preventDefault();
  setIsDragOver(true);
};

export const handleDragLeave = (
  e: React.DragEvent,
  setIsDragOver: (value: boolean) => void
) => {
  e.preventDefault();
  setIsDragOver(false);
};

export const handleDrop = (
  e: React.DragEvent,
  setIsDragOver: (value: boolean) => void,
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>,
  setMessage: (message: string) => void
) => {
  e.preventDefault();
  setIsDragOver(false);

  const files = Array.from(e.dataTransfer.files);
  const csvFiles = files.filter((file) => validateCsvFile(file));

  if (csvFiles.length > 0) {
    setUploadedFiles((prev) => [...prev, ...csvFiles]);
    setMessage(`✅ Added ${csvFiles.length} file(s)`);
  } else {
    setMessage("❌ Please upload valid CSV files");
  }
};

export const handleFileSelect = (
  e: React.ChangeEvent<HTMLInputElement>,
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>,
  setMessage: (message: string) => void
) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    const csvFiles = Array.from(files).filter((file) => validateCsvFile(file));
    if (csvFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...csvFiles]);
      setMessage(`✅ Added ${csvFiles.length} file(s)`);
    } else {
      setMessage("❌ Please upload valid CSV files");
    }
  }
};

export const handleFileDelete = (
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>
) => {
  setUploadedFiles([]);
};

// Parse CSV file and return transactions for review
export const handleParseCsvFile = async (
  uploadedFiles: File[],
  user: User | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setMessage: (message: string) => void,
  setLoading: (loading: boolean) => void
): Promise<{
  transactions: Transaction[];
  connections: Connection[];
} | null> => {
  if (uploadedFiles.length === 0) return null;

  setLoading(true);

  const allTransactions: Transaction[] = [];
  const allConnections: Connection[] = [];

  try {
    // Process all uploaded files
    for (const file of uploadedFiles) {
      const result = await processCsvFile(file, user, setUser, setMessage);

      if (result) {
        allTransactions.push(...result.transactions);
        allConnections.push(result.connection);
      }
    }

    setLoading(false);

    if (allTransactions.length === 0) {
      setMessage("❌ No transactions found in the uploaded files");
      return null;
    }

    return {
      transactions: allTransactions,
      connections: allConnections,
    };
  } catch (error) {
    setLoading(false);
    setMessage(
      `❌ ${error instanceof Error ? error.message : "Failed to parse CSV"}`
    );
    return null;
  }
};

// Confirm and save parsed transactions
export const handleConfirmTransactions = async (
  transactions: Transaction[],
  connections: Connection[],
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>,
  router: { push: (path: string) => void }
) => {
  // Add connections to state
  connections.forEach((connection) => {
    setConnections((prev) => [...prev, connection]);
  });

  // Redirect to analysis page
  setTimeout(() => {
    router.push("/analysis");
  }, 500);
};
