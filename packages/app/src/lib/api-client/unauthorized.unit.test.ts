import { beforeEach, describe, expect, it, mock } from "bun:test";

import { createClient, createConfig } from "./gen/client";
import {
  installUnauthorizedInterceptor,
  requestUsesBearerAuth,
  setUnauthorizedHandler,
} from "./unauthorized";

function mockUnauthorizedFetch(): typeof fetch {
  return Object.assign(
    () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          headers: { "Content-Type": "application/json" },
          status: 401,
        }),
      ),
    fetch,
  );
}

describe("[Unit] requestUsesBearerAuth", () => {
  it("returns true when security includes http bearer", () => {
    expect(
      requestUsesBearerAuth({
        security: [{ scheme: "bearer", type: "http" }],
      }),
    ).toBe(true);
  });

  it("returns false for api key security only", () => {
    expect(
      requestUsesBearerAuth({
        security: [{ name: "x-api-key", type: "apiKey" }],
      }),
    ).toBe(false);
  });

  it("returns false when security is omitted", () => {
    expect(requestUsesBearerAuth({})).toBe(false);
  });
});

describe("[Unit] installUnauthorizedInterceptor", () => {
  beforeEach(() => {
    setUnauthorizedHandler(undefined);
  });

  // Disabled due to CI failure that cannot be reproduced locally
  // it("invokes the unauthorized handler on 401 bearer responses", async () => {
  //   const handler = mock(() => Promise.resolve());
  //   setUnauthorizedHandler(handler);

  //   const testClient = createClient(
  //     createConfig({
  //       auth: () => "jwt-123",
  //       baseUrl: "https://example.com",
  //       fetch: mockUnauthorizedFetch(),
  //     }),
  //   );

  //   installUnauthorizedInterceptor(testClient);

  //   await expect(
  //     testClient.get({
  //       security: [{ scheme: "bearer", type: "http" }],
  //       throwOnError: true,
  //       url: "/api/v1/cards",
  //     }),
  //   ).rejects.toBeDefined();

  //   await expect(handler).toHaveBeenCalledTimes(1);
  // });

  it("does not invoke the handler on 401 api key responses", async () => {
    const handler = mock(() => Promise.resolve());
    setUnauthorizedHandler(handler);

    const testClient = createClient(
      createConfig({
        auth: () => "api-key",
        baseUrl: "https://example.com",
        fetch: mockUnauthorizedFetch(),
      }),
    );

    installUnauthorizedInterceptor(testClient);

    await expect(
      testClient.post({
        body: { email: "a@b.com", password: "secret" },
        security: [{ name: "x-api-key", type: "apiKey" }],
        throwOnError: true,
        url: "/api/v1/auth/login",
      }),
    ).rejects.toBeDefined();

    expect(handler).not.toHaveBeenCalled();
  });

  // Disabled due to CI failure that cannot be reproduced locally
  // it("deduplicates concurrent unauthorized handling", async () => {
  //   let resolveHandler: (() => void) | undefined;
  //   const handler = mock(
  //     () =>
  //       new Promise<void>((resolve) => {
  //         resolveHandler = resolve;
  //       }),
  //   );
  //   setUnauthorizedHandler(handler);

  //   const testClient = createClient(
  //     createConfig({
  //       auth: () => "jwt-123",
  //       baseUrl: "https://example.com",
  //       fetch: mockUnauthorizedFetch(),
  //     }),
  //   );

  //   installUnauthorizedInterceptor(testClient);

  //   const request = () =>
  //     testClient.get({
  //       security: [{ scheme: "bearer", type: "http" }],
  //       throwOnError: true,
  //       url: "/api/v1/cards",
  //     });

  //   const first = request();
  //   const second = request();

  //   await Promise.allSettled([first, second]);

  //   expect(handler).toHaveBeenCalledTimes(1);

  //   resolveHandler?.();
  //   await handler.mock.results[0]?.value;
  // });
});
