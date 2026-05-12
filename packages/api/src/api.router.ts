import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AuthEnv } from "./middleware/auth.middleware.js";
import authRouter from "./routes/auth.routes.js";
import cardsRouter from "./routes/cards.routes.js";

const app = new Hono<AuthEnv>()
  .route("/auth", authRouter)
  .route("/cards", cardsRouter)
  .onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json(
        {
          error: error.message,
        },
        error.status,
      );
    }
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Invalid request input",
          issues: error.issues,
        },
        400,
      );
    }
    throw error;
  });

export default app;
