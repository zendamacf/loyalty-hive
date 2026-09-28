/** bcrypt cost factor for password and API key hashing */
export const BCRYPT_COST = 10;

export const API_KEY_HEADER = "x-api-key";

/** Plaintext API key seeded in tests (hashed with BCRYPT_COST in test setup) */
export const TEST_API_KEY = "loyalty-hive-test-api-key";

export const TEST_API_KEY_INTEGRATION = "test";

/** Deep link opened by the app to complete email verification */
export const EMAIL_VERIFICATION_LINK_BASE = "loyaltyhive://verify-email";

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;

export const AUTH_RESEND_VERIFICATION_IP_RATE_LIMIT = {
  max: 5,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const AUTH_RESEND_VERIFICATION_EMAIL_RATE_LIMIT = {
  max: 3,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};
