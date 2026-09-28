import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { EMAIL_VERIFICATION_TTL_HOURS } from "./constants.js";

export function generateVerificationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function verificationExpiresAt(): Date {
  return new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
}

export async function assignVerificationTokenToUser(
  userId: string,
): Promise<string> {
  const token = generateVerificationToken();
  const tokenHash = hashVerificationToken(token);
  const expiresAt = verificationExpiresAt();

  await db
    .update(users)
    .set({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    })
    .where(eq(users.id, userId));

  return token;
}

export async function verifyEmailWithToken(
  token: string,
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const tokenHash = hashVerificationToken(token);

  const [user] = await db
    .select({
      id: users.id,
      emailVerifiedAt: users.emailVerifiedAt,
      storedHash: users.emailVerificationTokenHash,
      expiresAt: users.emailVerificationExpiresAt,
    })
    .from(users)
    .where(eq(users.emailVerificationTokenHash, tokenHash));

  if (!user?.storedHash || !user.expiresAt) {
    return { ok: false };
  }

  if (user.emailVerifiedAt) {
    return { ok: true, userId: user.id };
  }

  if (user.expiresAt.getTime() < Date.now()) {
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

  const now = new Date();
  await db
    .update(users)
    .set({
      emailVerifiedAt: now,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  return { ok: true, userId: user.id };
}
