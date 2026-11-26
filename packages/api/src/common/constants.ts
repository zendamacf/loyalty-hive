/** bcrypt cost factor for password and API key hashing */
export const BCRYPT_COST = 10;

export const API_KEY_HEADER = "x-api-key";

/** httpOnly cookie that holds the admin session JWT. */
export const ADMIN_SESSION_COOKIE = "lh_admin_session";

/** The admin session cookie is only sent to the admin API. */
export const ADMIN_SESSION_COOKIE_PATH = "/api/v1/admin";

/** `aud` claim of admin JWTs. App user tokens do not have it. */
export const ADMIN_JWT_AUDIENCE = "loyalty-hive-admin";

/** Plaintext API key seeded in tests (hashed with BCRYPT_COST in test setup) */
export const TEST_API_KEY = "loyalty-hive-test-api-key";

export const TEST_API_KEY_INTEGRATION = "test";

/** Deep link base of the installed app (`scheme` in packages/app/app.json). */
export const DEFAULT_APP_DEEP_LINK_BASE = "loyaltyhive://";

/** URL path of the pages that email links open. They hand the token to the app. */
export const APP_LINKS_PATH = "/links";

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

export const PASSWORD_RESET_TTL_MINUTES = 60;

/** Days a deleted account is kept (login blocked) before it is removed for good. */
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

/** Contact for account restore requests during the grace period. */
export const SUPPORT_EMAIL = "kalopsia.apps@gmail.com";

const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;

export const AUTH_RESEND_VERIFICATION_IP_RATE_LIMIT = {
  max: 5,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const AUTH_RESEND_VERIFICATION_EMAIL_RATE_LIMIT = {
  max: 3,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const AUTH_FORGOT_PASSWORD_IP_RATE_LIMIT = {
  max: 5,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const AUTH_FORGOT_PASSWORD_EMAIL_RATE_LIMIT = {
  max: 3,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const AUTH_RESET_PASSWORD_IP_RATE_LIMIT = {
  max: 10,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const ADMIN_LOGIN_IP_RATE_LIMIT = {
  max: 5,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const ADMIN_LOGIN_EMAIL_RATE_LIMIT = {
  max: 5,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const SHARE_INVITE_TTL_DAYS = 7;

/**
 * Share invite limits. They count invite rows, also cancelled and expired
 * ones, so that invite → cancel → invite does not reset them.
 */
export const SHARE_LIMITS = {
  /** Pending invites for each owner. */
  maxPendingInvites: 10,
  /** New invites for each owner in 24 hours. */
  maxInvitesPerDay: 20,
  /** Invite emails to one recipient email in 24 hours, from all owners. */
  maxEmailsPerRecipientPerDay: 5,
  /** Recipients (shares and pending invites) for each card or account. */
  maxRecipients: 10,
} as const;

export const SHARE_CREATE_IP_RATE_LIMIT = {
  max: 10,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};

export const AUTH_DELETE_ACCOUNT_RATE_LIMIT = {
  max: 5,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
};
