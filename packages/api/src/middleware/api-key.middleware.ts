import { compare as bcryptCompare } from "bcryptjs";
import type { MiddlewareHandler } from "hono";

import { API_KEY_HEADER } from "../common/constants.js";
import { InvalidApiKeyError, Unauthorized } from "../common/error.js";
import { db } from "../db/client.js";
import { apiKeys } from "../db/schema.js";

export const requireApiKey: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header(API_KEY_HEADER)?.trim();

  if (!apiKey) throw Unauthorized("API key is required");

  const rows = await db.select({ keyHash: apiKeys.keyHash }).from(apiKeys);

  let valid = false;
  for (const row of rows) {
    if (await bcryptCompare(apiKey, row.keyHash).catch(() => false)) {
      valid = true;
      break;
    }
  }

  if (!valid) throw new InvalidApiKeyError();

  return next();
};
