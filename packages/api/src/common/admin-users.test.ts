import { beforeEach, describe, expect, it } from "bun:test";
import { compare as bcryptCompare } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { adminUsers, lower, users } from "../db/schema";
import { AdminUserInputError, createAdminUser } from "./admin-users";

const ADMIN_EMAIL = "admin-users-test@example.com";
const VALID_PASSWORD = "AdminPassword123";

async function deleteTestAdmin() {
  await db.delete(adminUsers).where(eq(lower(adminUsers.email), ADMIN_EMAIL));
}

describe("createAdminUser", () => {
  beforeEach(deleteTestAdmin);

  it("creates an admin with a normalized email and a bcrypt hash", async () => {
    const created = await createAdminUser({
      email: `  ${ADMIN_EMAIL.toUpperCase()}  `,
      password: VALID_PASSWORD,
    });

    expect(created.email).toBe(ADMIN_EMAIL);

    const [row] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, created.id));
    expect(row?.email).toBe(ADMIN_EMAIL);
    expect(row?.passwordHash).not.toBe(VALID_PASSWORD);
    expect(await bcryptCompare(VALID_PASSWORD, row?.passwordHash ?? "")).toBe(
      true,
    );
    expect(row?.disabledAt).toBeNull();
    expect(row?.passwordChangedAt).toBeNull();
  });

  it("does not create a row in users", async () => {
    await createAdminUser({ email: ADMIN_EMAIL, password: VALID_PASSWORD });

    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(lower(users.email), ADMIN_EMAIL));
    expect(rows).toHaveLength(0);
  });

  it("rejects a duplicate email, ignoring case", async () => {
    await createAdminUser({ email: ADMIN_EMAIL, password: VALID_PASSWORD });

    await expect(
      createAdminUser({
        email: ADMIN_EMAIL.toUpperCase(),
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(AdminUserInputError);
  });

  it("rejects an invalid email", async () => {
    await expect(
      createAdminUser({ email: "not-an-email", password: VALID_PASSWORD }),
    ).rejects.toThrow(AdminUserInputError);
  });

  it("rejects a password that fails the password policy", async () => {
    await expect(
      createAdminUser({ email: ADMIN_EMAIL, password: "short" }),
    ).rejects.toThrow(AdminUserInputError);

    const rows = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(lower(adminUsers.email), ADMIN_EMAIL));
    expect(rows).toHaveLength(0);
  });
});
