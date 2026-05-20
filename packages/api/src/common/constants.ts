/** bcrypt cost factor for password and API key hashing */
export const BCRYPT_COST = 10;

export const API_KEY_HEADER = "x-api-key";

/** Plaintext API key seeded in tests (hashed with BCRYPT_COST in test setup) */
export const TEST_API_KEY = "loyalty-hive-test-api-key";

export const TEST_API_KEY_INTEGRATION = "test";
