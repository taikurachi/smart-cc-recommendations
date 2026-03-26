// UI Constants
export const PREVIEW_TRANSACTION_COUNT = 5;
export const FILE_ROTATION_INTERVAL_MS = 1300;
export const ICON_SIZE = {
  SMALL: 14,
  MEDIUM: 16,
  LARGE: 24,
  XLARGE: 50,
} as const;

// Modal Heights
export const MODAL_MAX_HEIGHT = {
  CONTENT: "50vh",
  TABLE: "96",
} as const;

// Button State Indices
export const BUTTON_STATE = {
  IDLE: 0,
  PROCESSING: 1,
  SUCCESS: 2,
  FAIL: 3,
} as const;

// Toast Durations
export const TOAST_DURATION = {
  SHORT: 3000,
  DEFAULT: 5000,
  LONG: 7000,
} as const;

// Transaction fetch defaults
export const TRANSACTION_MONTHS_DEFAULT = 6;
export const TRANSACTION_MONTHS_ANALYSIS = 12;

// Plaid transaction primaries that represent non-spending (payments, transfers, income)
export const PAYMENT_PRIMARIES = new Set([
  "LOAN_PAYMENTS",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "INCOME",
]);

// Default Card Preferences (single source of truth)
export const DEFAULT_CARD_PREFERENCES = {
  travel: false,
  cashback: false,
  no_annual_fee: false,
  low_interest: false,
  beginner_friendly: false,
} as const;

