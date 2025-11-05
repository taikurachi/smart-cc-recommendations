// Common CSS class combinations for reusability

export const INPUT_STYLES = {
  BASE: "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
  TEXT_RIGHT: "w-full px-2 py-1 text-xs border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500",
} as const;

export const BUTTON_STYLES = {
  ICON_HOVER: "hover:scale-110 cursor-pointer transition-transform",
  SMALL_ACTION: "flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors",
} as const;

export const CARD_STYLES = {
  SUMMARY: "rounded-lg p-4",
  TRANSACTION_ITEM: "bg-gray-50 rounded-lg p-3 flex items-center justify-between",
} as const;

export const TEXT_STYLES = {
  AMOUNT_POSITIVE: "font-semibold text-green-600",
  AMOUNT_NEGATIVE: "font-semibold text-red-600",
  TRANSACTION_NAME: "font-medium text-gray-900",
  TRANSACTION_DATE: "text-xs text-gray-600",
} as const;

