import { User, Connection, Transaction } from "./types";

export async function processCsvFile(
  file: File,
  user: User | null,
  setUser: (user: User) => void,
  setMessage: (message: string) => void
): Promise<{
  transactions: Transaction[];
  connection: Connection;
} | null> {
  try {
    setMessage("🔄 Processing CSV file...");

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
      if (currentUserId) {
        localStorage.setItem("userId", currentUserId);
      }
    }

    // Read and parse CSV file
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header and one data row");
    }

    // Parse CSV properly (handles quoted fields with commas)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9_]/g, "_")
    );
    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const transaction: Partial<Transaction> &
          Record<string, string | number> = {};
        headers.forEach((header, index) => {
          // Remove surrounding quotes if present
          let value = values[index] || "";
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          transaction[header] = value;
        });

        // Map CSV fields to Transaction interface
        // Support multiple common date field names
        const dateField =
          transaction.posted_date ||
          transaction.date ||
          transaction.transaction_date ||
          transaction.datetime ||
          "";

        // Support multiple common name/merchant field names
        const nameField =
          transaction.payee ||
          transaction.name ||
          transaction.merchant ||
          transaction.description ||
          transaction.vendor ||
          "";

        // Support multiple common amount field names
        const amountField =
          transaction.amount ||
          transaction.total ||
          transaction.price ||
          transaction.value ||
          "0";

        transaction.transaction_id = `csv_${i}_${Date.now()}`;
        transaction.account_id = "csv_upload";
        transaction.date = String(dateField);
        transaction.name = String(nameField);
        transaction.amount = parseFloat(String(amountField)) || 0;

        transactions.push(transaction as Transaction);
      }
    }

    setMessage(
      `✅ Successfully processed ${transactions.length} transactions from CSV`
    );

    // Create a mock connection for CSV data
    const mockConnection: Connection = {
      id: `csv_${Date.now()}`,
      item_id: `csv_${file.name}`,
      institution_name: `CSV Upload (${file.name})`,
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

    return {
      transactions,
      connection: mockConnection,
    };
  } catch (error) {
    console.error("CSV processing error:", error);
    setMessage(
      `❌ Error processing CSV: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return null;
  }
}

export function validateCsvFile(file: File): boolean {
  return file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
}
