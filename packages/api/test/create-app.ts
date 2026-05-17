import { Hono } from "hono";
import { sign } from "hono/jwt";
import apiRouter from "../src/api.router";
import { config } from "../src/common/config";
import { API_KEY_HEADER, TEST_API_KEY } from "../src/common/constants";

export function createApiRouterApp() {
  const app = new Hono();
  app.route("/api/v1", apiRouter);
  return app;
}

export async function signTestToken(userId: string) {
  return sign({ sub: userId }, config.jwt.accessSecret);
}

export function apiKeyHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  return { [API_KEY_HEADER]: TEST_API_KEY, ...headers };
}
