import { mock } from "bun:test";

type Handler = (url: URL, init: RequestInit) => Response | Promise<Response>;

const originalFetch = globalThis.fetch;

/** Replaces global fetch. Paths are relative, like in the browser. */
export function mockFetch(handler: Handler) {
  const fn = mock(async (input: RequestInfo | URL, init: RequestInit = {}) =>
    handler(new URL(String(input), "http://localhost"), init),
  );
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

export function restoreFetch() {
  globalThis.fetch = originalFetch;
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(status: number, error = "Error") {
  return jsonResponse({ error }, status);
}
