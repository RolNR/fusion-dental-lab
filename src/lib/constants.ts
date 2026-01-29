// Security constants
export const BCRYPT_SALT_ROUNDS = 12;

// Toast notification constants
export const DEFAULT_TOAST_DURATION = 5000; // milliseconds

// Pagination constants
export const DEFAULT_PAGE_SIZE = 10;

// Order limits
export const MAX_DRAFTS_PER_DOCTOR = parseInt(process.env.MAX_DRAFTS_PER_DOCTOR || '5', 10);

// Order cleanup
export const COMPLETED_ORDER_RETENTION_DAYS = parseInt(
  process.env.COMPLETED_ORDER_RETENTION_DAYS || '10',
  10
);
