import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import z from "zod";
import { APP_PLATFORM_HEADER } from "../common/client-headers.js";
import {
  isSupportedAppPlatform,
  minimumAppVersionForPlatform,
} from "../common/minimum-app-version.js";
import {
  errorResponse,
  jsonResponse,
  validationErrorResponse,
} from "../common/openapi-responses.js";
import { requireApiKey } from "../middleware/api-key.middleware.js";

const appVersionResponseSchema = z.object({
  platform: z.enum(["android", "ios"]),
  minimumVersion: z.string(),
});

const app = new Hono().get(
  "/app-version",
  requireApiKey,
  describeRoute({
    description:
      "Minimum supported app version for the requesting mobile platform",
    security: [{ apiKeyAuth: [] }],
    responses: {
      200: jsonResponse("Successful response", appVersionResponseSchema),
      400: validationErrorResponse(),
      401: errorResponse("API key is required"),
      403: errorResponse("Invalid API key"),
    },
  }),
  async (c) => {
    const platform = c.req.header(APP_PLATFORM_HEADER)?.trim().toLowerCase();

    if (!platform || !isSupportedAppPlatform(platform)) {
      return c.json(
        {
          error: "Invalid request input",
          issues: [
            {
              path: [APP_PLATFORM_HEADER],
              message: "A supported app platform header is required",
            },
          ],
        },
        400,
      );
    }

    return c.json({
      platform,
      minimumVersion: minimumAppVersionForPlatform(platform),
    });
  },
);

export default app;
