import { describe, expect, it } from "bun:test";

import { createClient, createConfig } from "./gen/client";
import {
  createRequestId,
  installRequestContextInterceptor,
} from "./request-context";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("[Unit] createRequestId", () => {
  it("returns a UUID", () => {
    expect(createRequestId()).toMatch(uuidPattern);
  });
});

describe("[Unit] installRequestContextInterceptor", () => {
  it("adds a unique x-request-id header to each request", async () => {
    const requestIds: string[] = [];
    const testClient = createClient(
      createConfig({
        baseUrl: "https://example.com",
        fetch: Object.assign((input: RequestInfo | URL) => {
          const request = input instanceof Request ? input : new Request(input);
          const requestId = request.headers.get("x-request-id");
          if (requestId) {
            requestIds.push(requestId);
          }

          return Promise.resolve(new Response("ok", { status: 200 }));
        }, fetch),
      }),
    );

    installRequestContextInterceptor(testClient);

    await testClient.get({ url: "/api/v1/cards" });
    await testClient.get({ url: "/api/v1/brands" });

    expect(requestIds).toHaveLength(2);
    expect(requestIds[0]).toMatch(uuidPattern);
    expect(requestIds[1]).toMatch(uuidPattern);
    expect(requestIds[0]).not.toBe(requestIds[1]);
  });
});
