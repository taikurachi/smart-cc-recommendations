import { processCsvFile, validateCsvFile } from "./csvOperations";
import { User, Connection } from "./types";

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

export const handleProcessCsvFile = async (
  uploadedFiles: File[],
  user: User | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setMessage: (message: string) => void,
  setLoading: (loading: boolean) => void,
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>,
  router: { push: (path: string) => void }
) => {
  if (uploadedFiles.length === 0) return;

  setLoading(true);

  // Process all uploaded files
  for (const file of uploadedFiles) {
    const result = await processCsvFile(file, user, setUser, setMessage);

    if (result) {
      setConnections((prev) => [...prev, result.connection]);
    }
  }

  // Redirect to analysis page after successful CSV processing
  setTimeout(() => {
    router.push("/analysis");
  }, 1500); // Small delay to show success message

  setLoading(false);
};
