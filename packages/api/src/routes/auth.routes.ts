import { compare as bcryptCompare, hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { sign } from "hono/jwt";

import { describeRoute, validator } from "hono-openapi";
import z from "zod";
import { config } from "../common/config.js";
import { API_KEY_HEADER, BCRYPT_COST } from "../common/constants.js";
import { Unauthorized } from "../common/error.js";
import {
  errorResponse,
  jsonResponse,
  validationErrorResponse,
} from "../common/openapi-responses.js";
import { db } from "../db/client.js";
import { lower, users } from "../db/schema.js";
import { requireApiKey } from "../middleware/api-key.middleware.js";

const credentialsBodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

const loginResponseSchema = z.object({
  token: z.string(),
});

const signupResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
});

const apiKeyHeaderSchema = z.object({
  [API_KEY_HEADER]: z.string().min(1),
});

const app = new Hono()
  .use(requireApiKey)
  .post(
    "/login",
    describeRoute({
      description:
        "Sign in with email and password; returns a JWT access token",
      security: [{ apiKeyAuth: [] }],
      responses: {
        200: jsonResponse("Successful response", loginResponseSchema),
        401: errorResponse("Invalid email or password"),
        403: errorResponse("Invalid API key"),
        400: validationErrorResponse(),
      },
    }),
    validator("header", apiKeyHeaderSchema),
    validator("json", credentialsBodySchema),
    async (c) => {
      const { email, password } = c.req.valid("json");

      const [user] = await db
        .select({
          id: users.id,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(lower(users.email), email));

      const valid =
        user &&
        (await bcryptCompare(password, user.passwordHash).catch(() => false));

      if (!valid) throw Unauthorized("Invalid email or password");

      const token = await sign({ sub: user.id }, config.jwt.accessSecret);

      return c.json({ token });
    },
  )
  .post(
    "/signup",
    describeRoute({
      description: "Create a new user account",
      security: [{ apiKeyAuth: [] }],
      responses: {
        201: jsonResponse("Account created", signupResponseSchema),
        403: errorResponse("Invalid API key"),
        409: errorResponse("Email already registered"),
        400: validationErrorResponse(),
      },
    }),
    validator("header", apiKeyHeaderSchema),
    validator("json", credentialsBodySchema),
    async (c) => {
      const { email, password } = c.req.valid("json");
      const passwordHash = await bcryptHash(password, BCRYPT_COST);

      try {
        const [created] = await db
          .insert(users)
          .values({
            email,
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
