import { Hono } from "hono";
import { sign } from "hono/jwt";
import apiRouter from "../src/api.router";
import { config } from "../src/common/config";

export function createApiRouterApp() {
  const app = new Hono();
  app.route("/api/v1", apiRouter);
  return app;
}

export async function signTestToken(userId: string) {
  return sign({ sub: userId }, config.jwt.accessSecret);
}
