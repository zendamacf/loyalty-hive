import { Hono } from "hono";
import apiRouter from "../src/api.router";
import { API_KEY_HEADER, TEST_API_KEY } from "../src/common/constants";
import { signAccessToken } from "../src/common/jwt-access-token";

export function createApiRouterApp() {
  const app = new Hono();
  app.route("/api/v1", apiRouter);
  return app;
}

export async function signTestToken(userId: string) {
  return signAccessToken(userId);
}

export function apiKeyHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  return { [API_KEY_HEADER]: TEST_API_KEY, ...headers };
}

export function authBearerHeaders(
  token: string,
  headers: Record<string, string> = {},
): Record<string, string> {
  return { Authorization: `Bearer ${token}`, ...headers };
}
