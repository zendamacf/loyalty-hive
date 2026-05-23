import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { ResolvedRequestOptions } from "./gen/client/types.gen";
import { createClient, createConfig } from "./gen/client";
import {
  bindUnauthorizedHandler,
  installUnauthorizedInterceptor,
  requestUsesBearerAuth,
  resetUnauthorizedModuleStateForTests,
} from "./unauthorized.impl";

const bearerSecurity = [{ scheme: "bearer", type: "http" }] as const;

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    headers: { "Content-Type": "application/json" },
    status: 401,
  });
}

async function flushMicrotasks(): Promise<void> {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

async function invokeInstalledResponseInterceptor(
  testClient: ReturnType<typeof createClient>,
  response: Response,
  options: Pick<ResolvedRequestOptions, "security">,
): Promise<Response> {
  const interceptor = testClient.interceptors.response.fns.at(-1);
  if (interceptor == null) {
    throw new Error("Expected a response interceptor to be installed");
  }

  return interceptor(
    response,
    new Request("https://example.com/api/v1/cards"),
    options as ResolvedRequestOptions,
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
    resetUnauthorizedModuleStateForTests();
  });

  it("invokes the unauthorized handler on 401 bearer responses", async () => {
    const handler = mock(() => Promise.resolve());

    const testClient = createClient(
      createConfig({
        baseUrl: "https://example.com",
      }),
    );

    bindUnauthorizedHandler(testClient, handler);
    installUnauthorizedInterceptor(testClient);

    await invokeInstalledResponseInterceptor(testClient, unauthorizedResponse(), {
      security: [...bearerSecurity],
    });
    await flushMicrotasks();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not invoke the handler on 401 api key responses", async () => {
    const handler = mock(() => Promise.resolve());

    const testClient = createClient(
      createConfig({
        baseUrl: "https://example.com",
      }),
    );

    bindUnauthorizedHandler(testClient, handler);
    installUnauthorizedInterceptor(testClient);

    await invokeInstalledResponseInterceptor(testClient, unauthorizedResponse(), {
      security: [{ name: "x-api-key", type: "apiKey" }],
    });
    await flushMicrotasks();

    expect(handler).not.toHaveBeenCalled();
  });

  it("deduplicates concurrent unauthorized handling", async () => {
    let resolveHandler: (() => void) | undefined;
    const handler = mock(
      () =>
        new Promise<void>((resolve) => {
          resolveHandler = resolve;
        }),
    );

    const testClient = createClient(
      createConfig({
        baseUrl: "https://example.com",
      }),
    );

    bindUnauthorizedHandler(testClient, handler);
    installUnauthorizedInterceptor(testClient);

    const options = { security: [...bearerSecurity] };

    const first = invokeInstalledResponseInterceptor(
      testClient,
      unauthorizedResponse(),
      options,
    );
    const second = invokeInstalledResponseInterceptor(
      testClient,
      unauthorizedResponse(),
      options,
    );

    await flushMicrotasks();
    expect(handler).toHaveBeenCalledTimes(1);

    resolveHandler?.();
    await Promise.all([first, second]);
  });
});
