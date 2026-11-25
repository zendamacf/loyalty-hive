import { compare as bcryptCompare, hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import z from "zod";
import { deleteAccount } from "../common/account-deletion.js";
import { API_KEY_HEADER, BCRYPT_COST } from "../common/constants.js";
import {
  issueAndSendVerificationEmail,
  userNeedsVerificationEmail,
  verifyEmailWithToken,
} from "../common/email-verification.js";
import {
  ACCOUNT_DELETED_MESSAGE,
  ACCOUNT_PENDING_DELETION_EMAIL_MESSAGE,
  BadRequest,
  Forbidden,
  INCORRECT_PASSWORD_MESSAGE,
  INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
  INVALID_VERIFICATION_TOKEN_MESSAGE,
  Unauthorized,
} from "../common/error.js";
import { signAccessToken } from "../common/jwt-access-token.js";
import {
  errorResponse,
  jsonResponse,
  validationErrorResponse,
} from "../common/openapi-responses.js";
import {
  loginPasswordSchema,
  signupPasswordSchema,
} from "../common/password-policy.js";
import {
  issueAndSendPasswordResetEmail,
  resetPasswordWithToken,
} from "../common/password-reset.js";
import { db } from "../db/client.js";
import { lower, users } from "../db/schema.js";
import { requireApiKey } from "../middleware/api-key.middleware.js";
import {
  type AuthEnv,
  requireUserAuth,
} from "../middleware/auth.middleware.js";
import {
  authDeleteAccountRateLimit,
  authForgotPasswordEmailRateLimit,
  authForgotPasswordIpRateLimit,
  authLoginEmailRateLimit,
  authLoginIpRateLimit,
  authResendVerificationEmailRateLimit,
  authResendVerificationIpRateLimit,
  authResetPasswordIpRateLimit,
  authSignupIpRateLimit,
} from "../middleware/rate-limit.middleware.js";

const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: loginPasswordSchema,
});

const signupBodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: signupPasswordSchema,
});

const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
});

const resendVerificationBodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

const forgotPasswordBodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  password: signupPasswordSchema,
});

const loginResponseSchema = z.object({
  token: z.string(),
});

const signupResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
});

const meResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  emailVerified: z.boolean(),
});

const verifyEmailResponseSchema = z.object({
  verified: z.literal(true),
});

const resendVerificationResponseSchema = z.object({
  message: z.string(),
});

const deleteAccountBodySchema = z.object({
  password: z.string().min(1),
});

const deleteAccountResponseSchema = z.object({
  deleted: z.literal(true),
  purgeAfter: z.iso.datetime(),
});

const forgotPasswordResponseSchema = z.object({
  message: z.string(),
});

const resetPasswordResponseSchema = z.object({
  reset: z.literal(true),
});

const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for this email, we sent password reset instructions.";

const RESEND_VERIFICATION_MESSAGE =
  "If your account needs verification, we sent an email.";

const apiKeyHeaderSchema = z.object({
  [API_KEY_HEADER]: z.string().min(1),
});

const app = new Hono<AuthEnv>()
  .post(
    "/login",
    authLoginIpRateLimit,
    requireApiKey,
    describeRoute({
      description:
        "Sign in with email and password; returns a short-lived JWT access token (lifetime via `JWT_ACCESS_TTL`, default 7d). There is no refresh token — sign in again after expiry. Rate limits (defaults): 10 requests/minute per IP and 5/minute per email (see `RATE_LIMIT_AUTH_*` env vars).",
      security: [{ apiKeyAuth: [] }],
      responses: {
        200: jsonResponse("Successful response", loginResponseSchema),
        401: errorResponse("Invalid email or password"),
        403: errorResponse(
          "Invalid API key, or the account was deleted and awaits removal",
        ),
        429: errorResponse("Too many requests"),
        400: validationErrorResponse(),
      },
    }),
    validator("header", apiKeyHeaderSchema),
    validator("json", loginBodySchema),
    authLoginEmailRateLimit,
    async (c) => {
      const { email, password } = c.req.valid("json");

      const [user] = await db
        .select({
          id: users.id,
          passwordHash: users.passwordHash,
          deletedAt: users.deletedAt,
          emailVerifiedAt: users.emailVerifiedAt,
          emailVerificationTokenHash: users.emailVerificationTokenHash,
          emailVerificationExpiresAt: users.emailVerificationExpiresAt,
        })
        .from(users)
        .where(eq(lower(users.email), email));

      const valid =
        user &&
        (await bcryptCompare(password, user.passwordHash).catch(() => false));

      if (!valid) throw Unauthorized("Invalid email or password");

      // Only a caller with the right password learns the account was deleted.
      if (user.deletedAt) throw Forbidden(ACCOUNT_DELETED_MESSAGE);

      if (userNeedsVerificationEmail(user)) {
        try {
          await issueAndSendVerificationEmail(user.id, email);
        } catch (error) {
          console.error(
            "[auth] Failed to send verification email on login",
            error,
          );
        }
      }

      const token = await signAccessToken(user.id);

      return c.json({ token });
    },
  )
  .post(
    "/signup",
    authSignupIpRateLimit,
    requireApiKey,
    describeRoute({
      description:
        "Create a new user account and send a verification email. Rate limit (default): 5 signups/minute per IP (see `RATE_LIMIT_AUTH_*` env vars).",
      security: [{ apiKeyAuth: [] }],
      responses: {
        201: jsonResponse("Account created", signupResponseSchema),
        403: errorResponse("Invalid API key"),
        409: errorResponse("Email already registered"),
        429: errorResponse("Too many requests"),
        400: validationErrorResponse(),
      },
    }),
    validator("header", apiKeyHeaderSchema),
    validator("json", signupBodySchema),
    async (c) => {
      const { email, password } = c.req.valid("json");
      const passwordHash = await bcryptHash(password, BCRYPT_COST);

      try {
        const [created] = await db
          .insert(users)
          .values({
            email,
            passwordHash,
          })
          .returning({
            id: users.id,
            email: users.email,
          });

        try {
          await issueAndSendVerificationEmail(created.id, created.email);
        } catch (error) {
          console.error(
            "[auth] Failed to send verification email on signup",
            error,
          );
        }

        return c.json(created, 201);
      } catch (error) {
        if (pgErrorCode(error) === "23505") {
          const [existing] = await db
            .select({ deletedAt: users.deletedAt })
            .from(users)
            .where(eq(lower(users.email), email));
          return c.json(
            {
              error: existing?.deletedAt
                ? ACCOUNT_PENDING_DELETION_EMAIL_MESSAGE
                : "An account with this email already exists",
            },
            409,
          );
        }
        throw error;
      }
    },
  )
  .post(
    "/verify-email",
    requireApiKey,
    describeRoute({
      description:
        "Verify a user's email address using the token from the verification link.",
      security: [{ apiKeyAuth: [] }],
      responses: {
        200: jsonResponse("Email verified", verifyEmailResponseSchema),
        400: validationErrorResponse(
          "Invalid or expired verification link or validation error",
        ),
        403: errorResponse("Invalid API key"),
      },
    }),
    validator("header", apiKeyHeaderSchema),
    validator("json", verifyEmailBodySchema),
    async (c) => {
      const { token } = c.req.valid("json");
      const result = await verifyEmailWithToken(token);

      if (!result.ok) {
        throw BadRequest(INVALID_VERIFICATION_TOKEN_MESSAGE);
      }

      return c.json({ verified: true as const });
    },
  )
  .post(
    "/resend-verification",
    authResendVerificationIpRateLimit,
    requireApiKey,
    describeRoute({
      description:
        "Resend the email verification message. Returns the same response whether or not the email exists or is already verified (rate-limited per IP and email).",
      security: [{ apiKeyAuth: [] }],
      responses: {
        200: jsonResponse("Request accepted", resendVerificationResponseSchema),
        403: errorResponse("Invalid API key"),
        429: errorResponse("Too many requests"),
        400: validationErrorResponse(),
      },
    }),
    validator("header", apiKeyHeaderSchema),
    validator("json", resendVerificationBodySchema),
    authResendVerificationEmailRateLimit,
    async (c) => {
      const { email } = c.req.valid("json");

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          emailVerifiedAt: users.emailVerifiedAt,
          deletedAt: users.deletedAt,
        })
        .from(users)
        .where(eq(lower(users.email), email));

      if (user && !user.emailVerifiedAt && !user.deletedAt) {
        try {
          await issueAndSendVerificationEmail(user.id, user.email);
        } catch (error) {
          console.error(
            "[auth] Failed to send verification email on resend",
            error,
          );
        }
      }

      return c.json({ message: RESEND_VERIFICATION_MESSAGE });
    },
  )
  .post(
    "/forgot-password",
    authForgotPasswordIpRateLimit,
    requireApiKey,
    describeRoute({
      description:
        "Request a password reset email. Returns the same response whether or not the email exists (no user enumeration). The emailed link is single-use and expires after 60 minutes. Rate limits: 5 requests/minute per IP and 3/minute per email.",
      security: [{ apiKeyAuth: [] }],
      responses: {
        200: jsonResponse("Request accepted", forgotPasswordResponseSchema),
        403: errorResponse("Invalid API key"),
        429: errorResponse("Too many requests"),
        400: validationErrorResponse(),
      },
    }),
    validator("header", apiKeyHeaderSchema),
    validator("json", forgotPasswordBodySchema),
    authForgotPasswordEmailRateLimit,
    async (c) => {
      const { email } = c.req.valid("json");

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          deletedAt: users.deletedAt,
        })
        .from(users)
        .where(eq(lower(users.email), email));

      if (user && !user.deletedAt) {
        try {
          await issueAndSendPasswordResetEmail(user.id, user.email);
        } catch (error) {
          console.error("[auth] Failed to send password reset email", error);
        }
      }

      return c.json({ message: FORGOT_PASSWORD_MESSAGE });
    },
  )
  .post(
    "/reset-password",
    authResetPasswordIpRateLimit,
    requireApiKey,
    describeRoute({
      description:
        "Set a new password using the token from the reset email. The new password must meet the sign-up password policy. On success, all existing access tokens for the user stop working; the user must sign in again. Rate limit: 10 requests/minute per IP.",
      security: [{ apiKeyAuth: [] }],
      responses: {
        200: jsonResponse("Password reset", resetPasswordResponseSchema),
        400: validationErrorResponse(
          "Invalid or expired reset link, weak password, or validation error",
        ),
        403: errorResponse("Invalid API key"),
        429: errorResponse("Too many requests"),
      },
    }),
    validator("header", apiKeyHeaderSchema),
    validator("json", resetPasswordBodySchema),
    async (c) => {
      const { token, password } = c.req.valid("json");
      const result = await resetPasswordWithToken(token, password);

      if (!result.ok) {
        throw BadRequest(INVALID_PASSWORD_RESET_TOKEN_MESSAGE);
      }

      return c.json({ reset: true as const });
    },
  )
  .delete(
    "/me",
    describeRoute({
      description:
        "Delete the authenticated user's account. Needs the current password. The account is marked deleted at once: sign-in stops, and all access tokens stop working. Cards and brand requests are removed for good after 30 days, which is the time to ask support for a restore. The email stays reserved until then. Rate limit: 5 requests/minute per user.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Account deleted", deleteAccountResponseSchema),
        400: validationErrorResponse(),
        401: errorResponse("Unauthorized"),
        403: errorResponse("Incorrect password"),
        429: errorResponse("Too many requests"),
      },
    }),
    requireUserAuth,
    validator("json", deleteAccountBodySchema),
    authDeleteAccountRateLimit,
    async (c) => {
      const userId = c.get("userId");
      if (!userId) {
        throw Unauthorized("You must be logged in to access this resource");
      }
      const { password } = c.req.valid("json");

      const result = await deleteAccount(userId, password);
      if (!result.ok) {
        // 403, not 401: the app signs the user out on any 401.
        if (result.reason === "incorrect_password") {
          throw Forbidden(INCORRECT_PASSWORD_MESSAGE);
        }
        throw Unauthorized("You must be logged in to access this resource");
      }

      return c.json({
        deleted: true as const,
        purgeAfter: result.purgeAfter.toISOString(),
      });
    },
  )
  .get(
    "/me",
    describeRoute({
      description: "Get the authenticated user's profile",
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Successful response", meResponseSchema),
        401: errorResponse("Unauthorized"),
      },
    }),
    requireUserAuth,
    async (c) => {
      const userId = c.get("userId");
      if (!userId) {
        throw Unauthorized("You must be logged in to access this resource");
      }

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw Unauthorized("You must be logged in to access this resource");
      }

      return c.json({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerifiedAt !== null,
      });
    },
  );

function pgErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  if (error instanceof Error && error.cause !== undefined) {
    return pgErrorCode(error.cause);
  }
  return undefined;
}

export default app;
