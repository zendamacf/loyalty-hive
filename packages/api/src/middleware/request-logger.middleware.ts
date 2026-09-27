import type { MiddlewareHandler } from "hono";

import { getClientIp } from "../common/client-ip.js";

type PrintFunc = (str: string) => void;

function requestPath(url: string): string {
  const pathStart = url.indexOf("/", 8);
  return pathStart === -1 ? url : url.slice(pathStart);
}

function formatElapsed(start: number): string {
  const delta = Date.now() - start;
  return delta < 1000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`;
}

export function requestLogger(fn: PrintFunc = console.log): MiddlewareHandler {
  return async (c, next) => {
    const { method, url } = c.req;
    const path = requestPath(url);
    const clientIp = getClientIp(c);

    fn(`<-- ${method} ${path} ${clientIp}`);
    const start = Date.now();
    await next();
    fn(
      `--> ${method} ${path} ${clientIp} ${c.res.status} ${formatElapsed(start)}`,
    );
  };
}
