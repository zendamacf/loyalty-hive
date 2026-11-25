import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { Hono } from "hono";

import { getClientIp, isPrivateAddress, resolveClientIp } from "./client-ip";
import { config, parseTrustProxyHops } from "./config";

describe("[Unit] resolveClientIp", () => {
  it("uses the socket address when no proxies are trusted", () => {
    expect(
      resolveClientIp({
        forwardedFor: "203.0.113.1",
        socketAddress: "172.18.0.2",
        trustedHops: 0,
      }),
    ).toBe("172.18.0.2");
  });

  it("uses the client address added by one trusted proxy (Traefik)", () => {
    expect(
      resolveClientIp({
        forwardedFor: "198.51.100.7",
        socketAddress: "172.18.0.2",
        trustedHops: 1,
      }),
    ).toBe("198.51.100.7");
  });

  it("ignores addresses the client put before the trusted entries", () => {
    // The client sent "1.2.3.4". Traefik added the real client address.
    expect(
      resolveClientIp({
        forwardedFor: "1.2.3.4, 198.51.100.7",
        socketAddress: "172.18.0.2",
        trustedHops: 1,
      }),
    ).toBe("198.51.100.7");
  });

  it("steps back one entry per trusted proxy (nginx, then Traefik)", () => {
    // nginx added the client. Traefik added nginx.
    expect(
      resolveClientIp({
        forwardedFor: "1.2.3.4, 198.51.100.7, 10.0.0.5",
        socketAddress: "172.18.0.2",
        trustedHops: 2,
      }),
    ).toBe("198.51.100.7");
  });

  it("uses the first entry when there are fewer entries than trusted proxies", () => {
    expect(
      resolveClientIp({
        forwardedFor: "198.51.100.7",
        socketAddress: "172.18.0.2",
        trustedHops: 3,
      }),
    ).toBe("198.51.100.7");
  });

  it("ignores X-Forwarded-For from a direct public connection", () => {
    expect(
      resolveClientIp({
        forwardedFor: "1.2.3.4",
        socketAddress: "203.0.113.99",
        trustedHops: 1,
      }),
    ).toBe("203.0.113.99");
  });

  it("uses the socket address when there is no header", () => {
    expect(
      resolveClientIp({
        forwardedFor: undefined,
        socketAddress: "172.18.0.2",
        trustedHops: 1,
      }),
    ).toBe("172.18.0.2");
  });

  it("uses unknown when there is no address at all", () => {
    expect(
      resolveClientIp({
        forwardedFor: undefined,
        socketAddress: undefined,
        trustedHops: 1,
      }),
    ).toBe("unknown");
  });

  it("skips empty entries", () => {
    expect(
      resolveClientIp({
        forwardedFor: " , 198.51.100.7 ,",
        socketAddress: "127.0.0.1",
        trustedHops: 1,
      }),
    ).toBe("198.51.100.7");
  });
});

describe("[Unit] isPrivateAddress", () => {
  for (const address of [
    "10.1.2.3",
    "127.0.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.0.1",
    "::1",
    "::ffff:172.18.0.2",
    "fd12:3456::1",
    "fe80::1",
  ]) {
    it(`${address} is private`, () => {
      expect(isPrivateAddress(address)).toBe(true);
    });
  }

  for (const address of [
    "8.8.8.8",
    "172.15.0.1",
    "172.32.0.1",
    "192.169.0.1",
    "::ffff:8.8.8.8",
    "2001:db8::1",
    "unknown",
  ]) {
    it(`${address} is not private`, () => {
      expect(isPrivateAddress(address)).toBe(false);
    });
  }
});

describe("[Unit] parseTrustProxyHops", () => {
  it("defaults to 0", () => {
    expect(parseTrustProxyHops(undefined)).toBe(0);
    expect(parseTrustProxyHops(" ")).toBe(0);
  });

  it("reads a whole number", () => {
    expect(parseTrustProxyHops("2")).toBe(2);
  });

  it("rejects bad values", () => {
    for (const value of ["-1", "1.5", "abc", "11"]) {
      expect(() => parseTrustProxyHops(value)).toThrow("TRUST_PROXY_HOPS");
    }
  });
});

describe("[Unit] getClientIp", () => {
  const originalHops = config.server.trustProxyHops;
  afterEach(() => {
    config.server.trustProxyHops = originalHops;
  });

  function app() {
    const hono = new Hono();
    hono.get("/", (c) => c.text(getClientIp(c)));
    return hono;
  }

  it("uses X-Forwarded-For when proxies are trusted", async () => {
    config.server.trustProxyHops = 1;
    const response = await app().request("/", {
      headers: { "x-forwarded-for": "1.2.3.4, 203.0.113.1" },
    });
    expect(await response.text()).toBe("203.0.113.1");
  });

  it("does not use X-Real-IP", async () => {
    config.server.trustProxyHops = 1;
    const response = await app().request("/", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(await response.text()).toBe("unknown");
  });

  it("warns one time when the header is present but no proxies are trusted", async () => {
    config.server.trustProxyHops = 0;
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (let i = 0; i < 2; i += 1) {
        const response = await app().request("/", {
          headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.5" },
        });
        expect(await response.text()).toBe("unknown");
      }
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain("(2 entries)");
    } finally {
      warn.mockRestore();
    }
  });
});
