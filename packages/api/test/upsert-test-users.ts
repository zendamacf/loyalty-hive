import { sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";

type UserInsert = typeof users.$inferInsert;

/**
 * Inserts route-test users with a verified email, and backfills verification
 * when the row already exists in a shared CI database (onConflictDoNothing alone
 * would leave legacy rows unverified and fail requireEmailVerified).
 */
export async function upsertVerifiedTestUsers(
  rows: UserInsert | UserInsert[],
) {
  const list = Array.isArray(rows) ? rows : [rows];
  const verifiedAt = new Date();

  await db
    .insert(users)
    .values(
      list.map((row) => ({
        ...row,
        emailVerifiedAt: row.emailVerifiedAt ?? verifiedAt,
      })),
    )
    .onConflictDoUpdate({
      target: users.id,
      set: {
        emailVerifiedAt: sql`COALESCE(${users.emailVerifiedAt}, excluded.email_verified_at)`,
      },
    });
}
