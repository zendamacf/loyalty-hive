import type { Context } from "hono";
import { getConnInfo } from "hono/bun";

import { config } from "./config.js";

/** Loopback, private, and link-local addresses: a proxy on the same host or Docker network. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^::ffff:/, "");

  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    );
  }

  return (
    ip === "::1" ||
    /^f[cd][0-9a-f]{2}:/.test(ip) || // fc00::/7 unique local
    /^fe[89ab][0-9a-f]:/.test(ip) // fe80::/10 link local
  );
}

/**
 * Finds the client address. Each proxy adds the address it received the
 * request from to the end of X-Forwarded-For, so only the last
 * `trustedHops` entries come from our own proxies. Entries before that were
 * sent by the client and can be anything.
 *
 * X-Forwarded-For is used only when the connection comes from a private
 * address (a proxy on our network). A direct connection from the internet
 * always uses the socket address. `socketAddress` is undefined only for
 * `app.request()` in tests.
 */
export function resolveClientIp({
  forwardedFor,
  socketAddress,
  trustedHops,
}: {
  forwardedFor: string | undefined;
  socketAddress: string | undefined;
  trustedHops: number;
}): string {
  const socket = socketAddress || "unknown";
  if (trustedHops <= 0 || !forwardedFor) return socket;
  if (socketAddress && !isPrivateAddress(socketAddress)) return socket;

  const chain = [
    ...forwardedFor
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    socket,
  ];
  // chain[last] is the proxy that connected to us. Step back one entry per trusted proxy.
  const index = chain.length - 1 - trustedHops;
  return chain[Math.max(0, index)] ?? socket;
}

function socketAddressOf(c: Context): string | undefined {
  try {
    return getConnInfo(c).remote.address || undefined;
  } catch {
    // app.request() in tests has no connection info
    return undefined;
  }
}

let warnedAboutUntrustedHeader = false;

export function getClientIp(c: Context): string {
  const forwardedFor = c.req.header("x-forwarded-for");
  const trustedHops = config.server.trustProxyHops;

  if (trustedHops === 0 && forwardedFor && !warnedAboutUntrustedHeader) {
    warnedAboutUntrustedHeader = true;
    console.warn(
      `⚠️ X-Forwarded-For is present (${forwardedFor.split(",").length} entries) but TRUST_PROXY_HOPS is 0. Rate limits use the proxy address, so all clients share one limit. Set TRUST_PROXY_HOPS to the number of proxies in front of the API.`,
    );
  }

  return resolveClientIp({
    forwardedFor,
    socketAddress: socketAddressOf(c),
    trustedHops,
  });
}
