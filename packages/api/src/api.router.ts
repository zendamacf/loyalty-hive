import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AuthEnv } from "./middleware/auth.middleware.js";
import adminRouter from "./routes/admin/admin.router.js";
import authRouter from "./routes/auth.routes.js";
import brandRequestsRouter from "./routes/brand-requests.routes.js";
import brandsRouter from "./routes/brands.routes.js";
import cardsRouter from "./routes/cards.routes.js";
import sharesRouter from "./routes/shares.routes.js";

const app = new Hono<AuthEnv>()
  .route("/admin", adminRouter)
  .route("/auth", authRouter)
  .route("/brand-requests", brandRequestsRouter)
  .route("/brands", brandsRouter)
  .route("/cards", cardsRouter)
  .route("/shares", sharesRouter)
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
