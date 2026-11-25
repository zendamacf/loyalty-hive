import { hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import z from "zod";

import { db } from "../db/client.js";
import { adminUsers, lower } from "../db/schema.js";
import { BCRYPT_COST } from "./constants.js";
import { signupPasswordSchema } from "./password-policy.js";

const createAdminUserSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: signupPasswordSchema,
});

export class AdminUserInputError extends Error {}

/** Creates an admin panel account. Throws {@link AdminUserInputError} on bad input or a duplicate email. */
export async function createAdminUser(input: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const parsed = createAdminUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new AdminUserInputError(
      parsed.error.issues.map((issue) => issue.message).join("; "),
    );
  }
  const { email, password } = parsed.data;

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(lower(adminUsers.email), email));
  if (existing) {
    throw new AdminUserInputError(
      `An admin with email ${email} already exists`,
    );
  }

  const passwordHash = await bcryptHash(password, BCRYPT_COST);
  const [created] = await db
    .insert(adminUsers)
    .values({ email, passwordHash })
    .returning({ id: adminUsers.id, email: adminUsers.email });

  if (!created) throw new Error("Failed to create admin user");
  return created;
}
