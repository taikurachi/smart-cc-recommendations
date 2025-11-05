// UI Constants
export const PREVIEW_TRANSACTION_COUNT = 5;
export const FILE_ROTATION_INTERVAL_MS = 1300;
export const ICON_SIZE = {
  SMALL: 14,
  MEDIUM: 16,
  LARGE: 24,
  XLARGE: 50,
} as const;

// CSV Processing Constants
export const DEFAULT_TRANSACTION_VALUES = {
  ACCOUNT_ID: "csv_upload",
  NEW_TRANSACTION_NAME: "New Transaction",
  NEW_TRANSACTION_AMOUNT: 0,
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

