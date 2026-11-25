import { compare as bcryptCompare } from "bcryptjs";
import { and, eq, isNotNull, isNull, lt } from "drizzle-orm";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { ACCOUNT_DELETION_GRACE_DAYS } from "./constants.js";

/**
 * Account deletion:
 * - The user row gets `deleted_at`. Login, token use, password reset and
 *   verification email are blocked at once, and the email stays reserved.
 * - After ACCOUNT_DELETION_GRACE_DAYS the purge job removes the row. The
 *   database cascade then removes cards (also soft-deleted ones) and brand
 *   requests. Brands stay, because they are shared catalog data.
 * - During the grace period an operator can restore the account (see
 *   docs/account-deletion.md).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function purgeDate(deletedAt: Date): Date {
  return new Date(deletedAt.getTime() + ACCOUNT_DELETION_GRACE_DAYS * DAY_MS);
}

export type DeleteAccountResult =
  | { ok: true; purgeAfter: Date }
  | { ok: false; reason: "incorrect_password" | "not_found" };

export async function deleteAccount(
  userId: string,
  password: string,
): Promise<DeleteAccountResult> {
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));

  if (!user) {
    return { ok: false, reason: "not_found" };
  }

  const valid = await bcryptCompare(password, user.passwordHash).catch(
    () => false,
  );
  if (!valid) {
    return { ok: false, reason: "incorrect_password" };
  }

  const now = new Date();
  const updated = await db
    .update(users)
    .set({
      deletedAt: now,
      passwordChangedAt: now,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .returning({ id: users.id });

  if (updated.length === 0) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, purgeAfter: purgeDate(now) };
}

/** Removes accounts deleted more than the grace period ago. Returns the count. */
export async function purgeDeletedAccounts(
  now: Date = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() - ACCOUNT_DELETION_GRACE_DAYS * DAY_MS);
  const removed = await db
    .delete(users)
    .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)))
    .returning({ id: users.id });
  return removed.length;
}
