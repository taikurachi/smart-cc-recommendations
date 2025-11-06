"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, Edit, Save, Trash2, Plus } from "lucide-react";
import Button from "@/app/components/Button";
import { Transaction } from "@/lib/types";
import {
  createNewTransaction,
  calculateTotal,
  formatCurrency,
  getTotalColorClass,
} from "@/lib/transactionHelpers";
import { PREVIEW_TRANSACTION_COUNT } from "@/lib/constants";
import TransactionItem from "./TransactionItem";

interface TransactionReviewModalProps {
  isOpen: boolean;
  transactions: Transaction[];
  onConfirm: (editedTransactions: Transaction[]) => void;
  onClose: () => void;
}

export default function TransactionReviewModal({
  isOpen,
  transactions,
  onConfirm,
  onClose,
}: TransactionReviewModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTransactions, setEditedTransactions] =
    useState<Transaction[]>(transactions);

  // Reset edited transactions when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setEditedTransactions(transactions);
      setIsEditMode(false);
    }
  }, [isOpen, transactions]);

  if (!isOpen) return null;

  // Calculate total
  const total = calculateTotal(editedTransactions);

  const handleEditTransaction = (
    index: number,
    field: keyof Transaction,
    value: string | number
  ) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedTransactions(updated);
  };

  const handleDeleteTransaction = (index: number) => {
    setEditedTransactions(editedTransactions.filter((_, i) => i !== index));
  };

  const handleAddTransaction = () => {
    setEditedTransactions([...editedTransactions, createNewTransaction()]);
  };

  const handleSaveEdits = () => {
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedTransactions(transactions);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    CSV Parsed Successfully!
                  </h2>
                  <p className="text-sm text-gray-600">
                    Review your transactions below
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">
                    Transactions Parsed
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {editedTransactions.length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium mb-1">
                    Total Amount
                  </p>
                  <p
                    className={`text-3xl font-bold ${getTotalColorClass(
                      total
                    )}`}
                  >
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    {isEditMode
                      ? "Edit Transactions:"
                      : `Transactions (showing ${Math.min(
                          PREVIEW_TRANSACTION_COUNT,
                          editedTransactions.length
                        )} of ${editedTransactions.length}):`}
                  </p>
                  {isEditMode && (
                    <button
                      onClick={handleAddTransaction}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                    >
                      <Plus size={14} />
                      Add Transaction
                    </button>
                  )}
                </div>

                {!isEditMode ? (
                  // View Mode - Show first 5
                  <>
                    <div className="space-y-2">
                      {editedTransactions
                        .slice(0, PREVIEW_TRANSACTION_COUNT)
                        .map((transaction, index) => (
                          <TransactionItem
                            key={index}
                            transaction={transaction}
                          />
                        ))}
                    </div>
                    {editedTransactions.length > PREVIEW_TRANSACTION_COUNT && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        +{" "}
                        {editedTransactions.length - PREVIEW_TRANSACTION_COUNT}{" "}
                        more transactions
                      </p>
                    )}
                  </>
                ) : (
                  // Edit Mode - Show all in table
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">
                              Date
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">
                              Name
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700">
                              Amount
                            </th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700 w-16">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {editedTransactions.map((transaction, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={transaction.date}
                                  onChange={(e) =>
                                    handleEditTransaction(
                                      index,
                                      "date",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={transaction.name}
                                  onChange={(e) =>
                                    handleEditTransaction(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={transaction.amount}
                                  onChange={(e) =>
                                    handleEditTransaction(
                                      index,
                                      "amount",
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleDeleteTransaction(index)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  aria-label="Delete transaction"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              {isEditMode ? (
                <>
                  <Button
                    onClick={handleCancelEdit}
                    color="gray"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdits}
                    color="blue"
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditMode(true)}
                    color="gray"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Edit Data
                  </Button>
                  <Button
                    onClick={() => onConfirm(editedTransactions)}
                    color="green"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Looks Good
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
