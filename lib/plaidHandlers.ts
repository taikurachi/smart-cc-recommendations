import {
  createLinkToken as createPlaidLinkToken,
  exchangePublicToken as exchangePlaidPublicToken,
} from "./plaidOperations";
import { User } from "./types";

export const handleCreateLinkToken = async (
  user: User | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>
) => {
  const token = await createPlaidLinkToken(user, setUser);
  return token;
};

export const handlePlaidSuccess = async (
  public_token: string,
  userId: string | undefined,
  setLoading: (loading: boolean) => void,
  loadData: () => Promise<void>
) => {
  setLoading(true);

  await exchangePlaidPublicToken(public_token, userId, loadData);

  setLoading(false);
};

export const handlePlaidExit = (err: unknown) => {
  if (err) {
    console.error("Plaid Link exit error:", err);
  }
};
