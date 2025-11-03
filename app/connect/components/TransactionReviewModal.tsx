"use client";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, Edit } from "lucide-react";
import Button from "@/app/components/Button";
import { Transaction } from "@/lib/types";

interface TransactionReviewModalProps {
  isOpen: boolean;
  transactions: Transaction[];
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}

export default function TransactionReviewModal({
  isOpen,
  transactions,
  onConfirm,
  onEdit,
  onClose,
}: TransactionReviewModalProps) {
  if (!isOpen) return null;

  // Calculate total
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

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
                    {transactions.length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium mb-1">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    ${Math.abs(total).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Sample Transactions */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Sample Transactions (first 5):
                </p>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {transaction.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {transaction.date}
                        </p>
                      </div>
                      <p
                        className={`font-semibold ${
                          transaction.amount < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                {transactions.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    + {transactions.length - 5} more transactions
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={onEdit}
                color="gray"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit size={16} />
                Edit Data
              </Button>
              <Button
                onClick={onConfirm}
                color="green"
                className="flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Looks Good
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

