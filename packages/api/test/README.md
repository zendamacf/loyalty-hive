# packages/api tests

Integration tests for the Hono API against a real Postgres database. No in-memory DB — tests run migrations and seed data via preload.

## Stack

| Layer | Choice |
|-------|--------|
| Runner | `bun test --preload ./test/setup.ts` |
| API | `bun:test` |
| HTTP | `app.request()` (Hono fetch API) |
| Coverage | `packages/api/bunfig.toml` |

CI runs `bun run test` from [`.github/workflows/api-pr-checks.yml`](../../.github/workflows/api-pr-checks.yml) against a Neon preview branch.

## Prerequisites

Set `DATABASE_URL` before running tests (see [`.env.example`](../.env.example)). The preload script:

1. Sets `NODE_ENV=test` and default secrets if unset
2. Runs Drizzle migrations from `drizzle/`
3. Seeds the test API key via [`seed-api-key.ts`](seed-api-key.ts)

## Layout

| Path | Role |
|------|------|
| [`setup.ts`](setup.ts) | Preload: migrate DB + seed API key |
| [`env.ts`](env.ts) | Sets `LIB_VERSION` from `package.json` |
| [`create-app.ts`](create-app.ts) | `createApiRouterApp`, `signTestToken`, `apiKeyHeaders`, `authBearerHeaders` |
| `src/**/*.test.ts` | Colocated route, middleware, and app tests |

## Test harnesses

Use the harness that matches what you are exercising:

| Harness | When to use |
|---------|-------------|
| `createApiRouterApp()` | Route and router behavior — includes global `onError` for JSON errors and Zod validation |
| `import app from "./app"` | Full app: OpenAPI docs, Swagger UI, Sentry wiring |
| Mini `Hono` + single middleware | Isolated middleware with explicit `onError` matching router JSON shape |

Prefer `createApiRouterApp()` for route tests so `HTTPException` and `ZodError` responses match production.

## Running tests

```bash
cd packages/api
export DATABASE_URL=postgres://...
bun run test
```

## Patterns

### Authenticated requests

```ts
const token = await signTestToken(userId);
const response = await app.request("/api/v1/cards", {
  headers: authBearerHeaders(token),
});
```

### API-key auth (login/signup)

```ts
const response = await app.request("/api/v1/auth/login", {
  method: "POST",
  headers: apiKeyHeaders({ "Content-Type": "application/json" }),
  body: JSON.stringify({ email, password }),
});
```

### Fixed UUIDs + `onConflictDoNothing`

Route suites use stable user/card/brand IDs and upsert helpers so tests tolerate a shared CI database without per-test transactions.
