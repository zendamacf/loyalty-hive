import { beforeEach, describe, expect, it } from "bun:test";

import { sentryCaptureExceptionMock } from "../../../test/mocks/sentry";
import { installErrorReportingInterceptor } from "./error-reporting";
import { createClient, createConfig } from "./gen/client";

function mockFetch(response: () => Response): typeof fetch {
  return Object.assign(() => Promise.resolve(response()), fetch);
}

function createTestClient(fetchImpl: typeof fetch) {
  const testClient = createClient(
    createConfig({ baseUrl: "https://example.com", fetch: fetchImpl }),
  );
  installErrorReportingInterceptor(testClient);
  return testClient;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("[Unit] installErrorReportingInterceptor", () => {
  beforeEach(() => {
    sentryCaptureExceptionMock.mockClear();
  });

  it("reports a 5xx response with its route template", async () => {
    const testClient = createTestClient(
      mockFetch(() => jsonResponse({ error: "boom" }, 500)),
    );

    await expect(
      testClient.get({
        url: "/api/v1/cards/{id}",
        path: { id: "card-1" },
        throwOnError: true,
      }),
    ).rejects.toEqual({ error: "boom" });

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    const [exception, context] = sentryCaptureExceptionMock.mock
      .calls[0] as unknown as [Error, { tags: Record<string, string> }];
    expect(exception.message).toBe("GET /api/v1/cards/{id} failed with 500");
    expect(context.tags["api.status"]).toBe("500");
  });

  it("reports a successful response the app could not read", async () => {
    const testClient = createTestClient(
      mockFetch(
        () =>
          new Response("not json", {
            headers: { "Content-Type": "application/json" },
            status: 200,
          }),
      ),
    );

    await expect(
      testClient.get({ url: "/api/v1/cards", throwOnError: true }),
    ).rejects.toBeInstanceOf(SyntaxError);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
  });

  it("does not report a 4xx response", async () => {
    const testClient = createTestClient(
      mockFetch(() => jsonResponse({ error: "nope" }, 403)),
    );

    await expect(
      testClient.get({ url: "/api/v1/cards", throwOnError: true }),
    ).rejects.toEqual({ error: "nope" });

    expect(sentryCaptureExceptionMock).not.toHaveBeenCalled();
  });

  it("does not report a network failure", async () => {
    const testClient = createTestClient(
      Object.assign(() => Promise.reject(new TypeError("offline")), fetch),
    );

    await expect(
      testClient.get({ url: "/api/v1/cards", throwOnError: true }),
    ).rejects.toBeInstanceOf(TypeError);

    expect(sentryCaptureExceptionMock).not.toHaveBeenCalled();
  });
});
