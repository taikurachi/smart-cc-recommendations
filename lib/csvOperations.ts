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
      localStorage.setItem("userId", currentUserId);
    }

    // Read and parse CSV file
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header and one data row");
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
