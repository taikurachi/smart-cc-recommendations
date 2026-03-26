"use client";
import { useApp } from "@/lib/ui/AppContext";
import { deleteConnection } from "@/lib/plaid/connectionOperations";
import { X } from "lucide-react";

export default function ManagePage() {
  const { connections, loadData } = useApp();

  const handleDeleteConnection = async (itemId: string) => {
    const success = await deleteConnection(itemId);

    if (success) {
      // Reload connections from server to sync state
      await loadData();
    }
  };
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="font-semibold text-3xl mb-2">Manage Your Connections</h1>
      <p className="text-gray-600 mb-8">
        List of all the connections that you authorized. Remove any if needed.
      </p>

      <div className="space-y-3">
        {connections.length > 0 ? (
          connections.map(({ id, item_id, institution_name }) => (
            <div
              key={id}
              className="flex gap-4 items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {institution_name || "Unknown Bank"}
                </p>
                <p className="text-xs text-gray-500">Item ID: {item_id}</p>
              </div>
              <button
                onClick={() => handleDeleteConnection(item_id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Delete connection"
              >
                <X size={20} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No connections found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Connect your bank account to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
