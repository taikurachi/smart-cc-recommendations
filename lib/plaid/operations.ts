import { User, Transaction } from "../types";
import { showToast } from "../ui/toastUtils";
import { TRANSACTION_MONTHS_DEFAULT } from "../constants";
import { setStoredUserId } from "../clientStorage";

export async function createLinkToken(
  user: User | null,
  setUser: (user: User) => void
): Promise<string | null> {
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
      if (currentUserId) {
        setStoredUserId(currentUserId);
      }
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
    showToast.success("Link token created! Ready to connect.");
    return link_token;
  } catch (error) {
    console.error("Error creating link token:", error);
    showToast.error("Failed to create link token");
    return null;
  }
}

export async function exchangePublicToken(
  publicToken: string,
  userId: string | undefined,
  loadUserData: () => Promise<void>
): Promise<void> {
  if (!userId) {
    showToast.error("User ID is required");
    return;
  }

  try {
    showToast.loading("Connecting your bank account...", { id: "plaid-exchange" });
    
    const response = await fetch("/api/plaid/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicToken: publicToken,
        userId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to connect bank account");
    }

    const data = await response.json();
    showToast.success(
      `${data.message} Connected to ${data.institution_name}! You can now view your spending analysis.`,
      { id: "plaid-exchange" }
    );

    // Reload user data to show new connection
    await loadUserData();
  } catch (error) {
    console.error("Error connecting bank:", error);
    showToast.error("Failed to connect bank account", { id: "plaid-exchange" });
  }
}

export async function fetchTransactions(
  userId: string | undefined,
  connectionId: string | undefined,
  loadUserData: () => Promise<void>
): Promise<Transaction[]> {
  try {
    showToast.loading("Fetching transactions...", { id: "fetch-transactions" });

    const response = await fetch("/api/plaid/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        itemId: connectionId,
        months: TRANSACTION_MONTHS_DEFAULT,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();
    showToast.success(
      `Loaded ${data.transactions?.length || 0} transactions`,
      { id: "fetch-transactions" }
    );

    // Reload connections to update last_synced
    await loadUserData();

    return data.transactions || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    showToast.error("Failed to fetch transactions", { id: "fetch-transactions" });
    return [];
  }
}
