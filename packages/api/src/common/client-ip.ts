import type { Context } from "hono";
import { getConnInfo } from "hono/bun";

function firstForwardedFor(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const first = header.split(",")[0]?.trim();
  return first || undefined;
}

export function getClientIp(c: Context): string {
  const forwarded = firstForwardedFor(c.req.header("x-forwarded-for"));
  if (forwarded) return forwarded;

  const realIp = c.req.header("x-real-ip")?.trim();
  if (realIp) return realIp;

  try {
    const { remote } = getConnInfo(c);
    if (remote.address) return remote.address;
  } catch {
    // app.request() in tests has no connection info
  }

  return "unknown";
}
