import { User, Transaction } from "./types";

export async function createLinkToken(
  user: User | null,
  setUser: (user: User) => void,
  setMessage: (message: string) => void
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
        localStorage.setItem("userId", currentUserId);
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
    setMessage("✅ Link token created! Now click 'Connect Bank Account'");
    return link_token;
  } catch (error) {
    console.error("Error creating link token:", error);
    setMessage("❌ Failed to create link token");
    return null;
  }
}

export async function exchangePublicToken(
  publicToken: string,
  userId: string | undefined,
  setMessage: (message: string) => void,
  loadUserData: () => Promise<void>
): Promise<void> {
  if (!userId) {
    setMessage("❌ User ID is required");
    return;
  }

  try {
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
    setMessage(
      `✅ ${data.message} Connected to ${data.institution_name}! You can now view your spending analysis.`
    );

    // Reload user data to show new connection
    await loadUserData();
  } catch (error) {
    console.error("Error connecting bank:", error);
    setMessage("❌ Failed to connect bank account");
  }
}

export async function fetchTransactions(
  userId: string | undefined,
  connectionId: string | undefined,
  setMessage: (message: string) => void,
  loadUserData: () => Promise<void>
): Promise<Transaction[]> {
  try {
    setMessage("🔄 Fetching transactions...");

    const response = await fetch("/api/plaid/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        itemId: connectionId,
        months: 6, // Get last 6 months
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();
    setMessage(`✅ Loaded ${data.transactions?.length || 0} transactions`);

    // Reload connections to update last_synced
    await loadUserData();

    return data.transactions || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    setMessage("❌ Failed to fetch transactions");
    return [];
  }
}
