import { Hono } from "hono";
import { z } from "zod";
import type { AuthEnv } from "./middleware/auth.middleware.js";
import { cardsRouter } from "./routes/cards.routes.js";

const apiRouter = new Hono<AuthEnv>();

apiRouter.route("/cards", cardsRouter);

apiRouter.onError((error, c) => {
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

export default apiRouter;
