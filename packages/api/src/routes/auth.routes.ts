import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { sign } from "hono/jwt";

import { describeRoute, resolver, validator } from "hono-openapi";
import z from "zod";
import { config } from "../common/config.js";
import { BCRYPT_COST } from "../common/constants.js";
import { Unauthorized } from "../common/error.js";
import { db } from "../db/client.js";
import { lower, users } from "../db/schema.js";

const credentialsBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const loginResponseSchema = z.object({
  token: z.string(),
});

const signupResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
});

const app = new Hono()
  .post(
    "/login",
    describeRoute({
      description:
        "Sign in with email and password; returns a JWT access token",
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
    validator("json", credentialsBodySchema),
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
  )
  .post(
    "/signup",
    describeRoute({
      description: "Create a new user account",
      responses: {
        201: {
          description: "Account created",
          content: {
            "application/json": { schema: resolver(signupResponseSchema) },
          },
        },
        409: {
          description: "Email already registered",
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
    validator("json", credentialsBodySchema),
    async (c) => {
      const { email, password } = c.req.valid("json");
      const normalizedEmail = email.trim().toLowerCase();
      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

      try {
        const [created] = await db
          .insert(users)
          .values({
            email: normalizedEmail,
            passwordHash,
          })
          .returning({
            id: users.id,
            email: users.email,
          });

        return c.json(created, 201);
      } catch (error) {
        if (pgErrorCode(error) === "23505") {
          return c.json(
            { error: "An account with this email already exists" },
            409,
          );
        }
        throw error;
      }
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
