import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { BCRYPT_COST } from "./constants.js";
import {
  assignVerificationTokenToUser,
  hashVerificationToken,
  userNeedsVerificationEmail,
  verifyEmailWithToken,
} from "./email-verification.js";

describe("[Unit] email verification", () => {
  it("verifies a valid token and marks the user verified", async () => {
    const email = `verify.${randomUUID()}@example.com`;
    const passwordHash = await bcryptHash("ValidPass1234", BCRYPT_COST);

    const [created] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id });

    const token = await assignVerificationTokenToUser(created.id);
    const result = await verifyEmailWithToken(token);

    expect(result).toEqual({ ok: true, userId: created.id });

    const [row] = await db
      .select({
        emailVerifiedAt: users.emailVerifiedAt,
        tokenHash: users.emailVerificationTokenHash,
      })
      .from(users)
      .where(eq(users.id, created.id));

    expect(row.emailVerifiedAt).not.toBeNull();
    expect(row.tokenHash).toBeNull();
  });

  it("rejects an invalid token", async () => {
    const result = await verifyEmailWithToken("not-a-real-token");
    expect(result).toEqual({ ok: false });
  });

  it("hashes tokens deterministically", () => {
    expect(hashVerificationToken("abc")).toBe(hashVerificationToken("abc"));
    expect(hashVerificationToken("abc")).not.toBe(hashVerificationToken("def"));
  });

  it("detects when a verification email should be sent", () => {
    expect(
      userNeedsVerificationEmail({
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: "abc",
        emailVerificationExpiresAt: new Date(Date.now() + 60_000),
      }),
    ).toBe(false);

    expect(
      userNeedsVerificationEmail({
        emailVerifiedAt: null,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      }),
    ).toBe(true);

    expect(
      userNeedsVerificationEmail({
        emailVerifiedAt: null,
        emailVerificationTokenHash: "abc",
        emailVerificationExpiresAt: new Date(Date.now() - 60_000),
      }),
    ).toBe(true);
  });
});
