import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { sign } from "hono/jwt";

import { describeRoute, resolver, validator } from "hono-openapi";
import z from "zod";
import { config } from "../common/config.js";
import { Unauthorized } from "../common/error.js";
import { db } from "../db/client.js";
import { lower, users } from "../db/schema.js";

const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const loginResponseSchema = z.object({
  token: z.string(),
});

const app = new Hono().post(
  "/login",
  describeRoute({
    description: "Sign in with email and password; returns a JWT access token",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": { schema: resolver(loginResponseSchema) },
        },
      },
      401: {
        description: "Invalid email or password",
        content: {
          "application/json": {
            schema: resolver(z.object({ error: z.string() })),
          },
        },
      },
      400: {
        description: "Invalid request input",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                error: z.string(),
                issues: z.array(z.unknown()),
              }),
            ),
          },
        },
      },
    },
  }),
  validator("json", loginBodySchema),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const [user] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(lower(users.email), email.trim().toLowerCase()));

    const valid =
      user &&
      (await bcrypt.compare(password, user.passwordHash).catch(() => false));

    if (!valid) throw Unauthorized("Invalid email or password");

    const token = await sign({ sub: user.id }, config.jwt.accessSecret);

    return c.json({ token });
  },
);

export default app;
