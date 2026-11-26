import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { hash as bcryptHash } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { buildEmailLink } from "./app-links.js";
import { BCRYPT_COST, PASSWORD_RESET_TTL_MINUTES } from "./constants.js";
import { sendTemplatedEmail } from "./mail/send-templated-email.js";

/**
 * Password reset security properties:
 * - Token: 32 random bytes (256 bits), base64url. Only the SHA-256 hash is stored.
 *   The token is random, not a user password. A fast hash is correct here: a
 *   slow hash (bcrypt) only protects low-entropy input, and the lookup needs
 *   a deterministic hash.
 * - Expiry: PASSWORD_RESET_TTL_MINUTES.
 * - Single use: the hash is cleared when the password changes. A new request
 *   replaces an earlier token.
 * - Comparison: hashes are compared with timingSafeEqual.
 * - Sessions: success sets `password_changed_at`, so earlier JWTs are rejected.
 */

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildPasswordResetLink(token: string): string {
  return buildEmailLink("reset-password", token);
}

/** Stores a new reset token for the user, then sends the email. */
export async function issueAndSendPasswordResetEmail(
  userId: string,
  email: string,
): Promise<void> {
  const token = generateResetToken();
  await db
    .update(users)
    .set({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: new Date(
        Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
      ),
    })
    .where(eq(users.id, userId));

  await sendTemplatedEmail("resetPassword", email, {
    resetUrl: buildPasswordResetLink(token),
    expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
  });
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const tokenHash = hashResetToken(token);

  const [user] = await db
    .select({
      id: users.id,
      storedHash: users.passwordResetTokenHash,
      expiresAt: users.passwordResetExpiresAt,
    })
    .from(users)
    .where(
      and(eq(users.passwordResetTokenHash, tokenHash), isNull(users.deletedAt)),
    );

  if (!user?.storedHash || !user.expiresAt) {
    return { ok: false };
  }

  const storedBuf = Buffer.from(user.storedHash, "hex");
  const providedBuf = Buffer.from(tokenHash, "hex");
  if (
    storedBuf.length !== providedBuf.length ||
    !timingSafeEqual(storedBuf, providedBuf)
  ) {
    return { ok: false };
  }

  if (user.expiresAt.getTime() < Date.now()) {
    return { ok: false };
  }

  const passwordHash = await bcryptHash(newPassword, BCRYPT_COST);

  // Matching on the token hash makes the update single-use if two requests race.
  const updated = await db
    .update(users)
    .set({
      passwordHash,
      passwordChangedAt: new Date(),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    })
    .where(
      and(eq(users.id, user.id), eq(users.passwordResetTokenHash, tokenHash)),
    )
    .returning({ id: users.id });

  if (updated.length === 0) {
    return { ok: false };
  }

  return { ok: true, userId: user.id };
}
