import {
  createLinkToken as createPlaidLinkToken,
  exchangePublicToken as exchangePlaidPublicToken,
} from "./plaidOperations";
import { User } from "./types";

export const handleCreateLinkToken = async (
  user: User | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setMessage: (message: string) => void,
  setLoading: (loading: boolean) => void,
  setLinkToken: (token: string) => void
) => {
  setLoading(true);
  setMessage("Creating Link Token ");

  const token = await createPlaidLinkToken(user, setUser, setMessage);
  if (token) {
    setLinkToken(token);
  }

  setLoading(false);
};

export const handlePlaidSuccess = async (
  public_token: string,
  userId: string | undefined,
  setMessage: (message: string) => void,
  setLoading: (loading: boolean) => void,
  loadData: () => Promise<void>,
  router: { push: (path: string) => void }
) => {
  setLoading(true);
  setMessage("🔄 Connecting your bank account...");

  await exchangePlaidPublicToken(public_token, userId, setMessage, loadData);

  setLoading(false);

  // Redirect to analysis page after successful connection
  setTimeout(() => {
    router.push("/analysis");
  }, 1500); // Small delay to show success message
};

export const handlePlaidExit = (
  err: unknown,
  setMessage: (message: string) => void
) => {
  if (err) {
    console.error("Plaid Link exit error:", err);
    setMessage("❌ Bank connection cancelled or failed");
  }
};
