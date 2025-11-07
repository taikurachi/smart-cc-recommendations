import { showToast } from "./toastUtils";

/**
 * Delete a connection from both the server and Plaid
 * @param itemId - The Plaid item_id of the connection to delete
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function deleteConnection(itemId: string): Promise<boolean> {
  try {
    showToast.loading("Removing connection...", { id: "delete-connection" });

    const response = await fetch("/api/plaid/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove connection");
    }

    const data = await response.json();
    showToast.success("Connection removed successfully!", {
      id: "delete-connection",
    });

    return true;
  } catch (error) {
    console.error("Error deleting connection:", error);
    showToast.error(
      error instanceof Error ? error.message : "Failed to remove connection",
      { id: "delete-connection" }
    );
    return false;
  }
}
