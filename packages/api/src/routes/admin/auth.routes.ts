import { compare as bcryptCompare, hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono-openapi";
import z from "zod";

import {
  clearAdminSessionCookie,
  isAdminAuthConfigured,
  setAdminSessionCookie,
  signAdminToken,
} from "../../common/admin-session.js";
import { BCRYPT_COST } from "../../common/constants.js";
import { Unauthorized } from "../../common/error.js";
import { loginPasswordSchema } from "../../common/password-policy.js";
import { db } from "../../db/client.js";
import { adminUsers, lower } from "../../db/schema.js";
import {
  type AdminEnv,
  requireAdmin,
} from "../../middleware/admin-auth.middleware.js";
import {
  adminLoginEmailRateLimit,
  adminLoginIpRateLimit,
} from "../../middleware/rate-limit.middleware.js";

const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: loginPasswordSchema,
});

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

/** Compared against when no admin has the email, so the response time does not show which emails exist. */
let dummyPasswordHash: Promise<string> | undefined;
function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= bcryptHash("dummy-password-for-timing", BCRYPT_COST);
  return dummyPasswordHash;
}

const app = new Hono<AdminEnv>()
  .post(
    "/login",
    adminLoginIpRateLimit,
    validator("json", loginBodySchema),
    adminLoginEmailRateLimit,
    async (c) => {
      if (!isAdminAuthConfigured()) {
        throw new HTTPException(503, {
          message: "Admin login is not configured",
        });
      }

      const { email, password } = c.req.valid("json");
      const [admin] = await db
        .select({
          id: adminUsers.id,
          email: adminUsers.email,
          passwordHash: adminUsers.passwordHash,
          disabledAt: adminUsers.disabledAt,
        })
        .from(adminUsers)
        .where(eq(lower(adminUsers.email), email));

      const passwordHash =
        admin?.passwordHash ?? (await getDummyPasswordHash());
      const valid = await bcryptCompare(password, passwordHash).catch(
        () => false,
      );

      if (!admin || !valid || admin.disabledAt) {
        throw Unauthorized(INVALID_CREDENTIALS_MESSAGE);
      }

      setAdminSessionCookie(c, await signAdminToken(admin.id));
      return c.json({ id: admin.id, email: admin.email });
    },
  )
  .post("/logout", (c) => {
    clearAdminSessionCookie(c);
    return c.body(null, 204);
  })
  .get("/me", requireAdmin, async (c) => {
    const [admin] = await db
      .select({ id: adminUsers.id, email: adminUsers.email })
      .from(adminUsers)
      .where(eq(adminUsers.id, c.get("adminId")));
    // requireAdmin already checked that the row exists.
    return c.json(admin);
  });

export default app;
