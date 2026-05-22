# packages/app tests

Unit and integration tests for the Expo app. No device/e2e runner — tests run in Node via Bun with mocked React Native and Expo modules.

## Stack (decision: stay on Bun)

| Layer | Choice |
|-------|--------|
| Runner | `bun test` with `--preload ./test/setup.ts --isolate` |
| API | `bun:test` (Jest-compatible subset) |
| UI queries/events | `@testing-library/react-native` |
| Coverage | `packages/app/bunfig.toml` |

**Alternatives considered:** Jest + `jest-expo` (Expo’s documented preset), Vitest + `vitest-native` (newer, higher risk). See [Framework evaluation](#framework-evaluation) below.

### Why we are not migrating now

This evaluation was **exploratory**, not driven by failing CI or flaky suites:

- **194 tests pass** across 39 files (`bun run test` in CI via [`.github/workflows/app-pr-checks.yml`](../../.github/workflows/app-pr-checks.yml)).
- Pain is mainly **mock maintenance** (`test/setup.ts` hand-rolled `react-native` stub), not runner instability.
- **Monorepo alignment:** [`packages/api`](../api/package.json) also uses `bun test`.
- **Jest + jest-expo** would reduce mock boilerplate but costs a medium–high port of every test file and slightly slower CI for limited gain today.

Revisit Jest if Expo SDK upgrades repeatedly break custom mocks, or `mock.module` isolation becomes a blocker without `--isolate`.

**Baseline (Bun, local):** 194 tests, ~29s wall time, coverage enabled — use this when comparing a future jest-expo spike.

---

## Running tests

```bash
cd packages/app
bun run test
```

Equivalent:

```bash
bun test --preload ./test/setup.ts --isolate ./src ./test/routes
```

---

## Layout

| Path | Role |
|------|------|
| [`setup.ts`](setup.ts) | Preload: global RN/navigation mocks + imports [`mocks/*`](mocks/) |
| [`render.tsx`](render.tsx) | `renderWithProviders`, shared QueryClient, provider hydration |
| [`mocks/`](mocks/) | Module mocks loaded before tests |
| [`routes/`](../test/routes/) | Expo Router entry tests |
| `src/**/*.test.ts(x)` | Colocated unit/component/screen tests |

---

## Patterns

### Preload and `mock.module`

Bun applies mocks from `--preload` before test files load. Use [`test/mocks/*.ts`](mocks/) for shared modules (API client, secure store, assets, barcode SVG).

`mock.module` keys on the **exact import string**. Asset paths differ by file location — register all variants in [`mocks/assets.ts`](mocks/assets.ts).

For test-only overrides, call `mock.module` in the test file **before** importing the module under test (often via dynamic import).

### Dynamic `await import()`

Use when a screen imports side effects or needs mocks registered in the same file first:

```ts
mock.module("@/lib/api-client/unauthorized", () => ({ /* ... */ }));
const { AuthProvider } = await import("./AuthProvider");
```

Screens that only rely on preload mocks can use static imports.

### `renderWithProviders`

Prefer over bare `render` when the tree needs auth, i18n, preferences, React Query, or overlays:

```ts
const { getByText } = await renderWithProviders(<SettingsScreen />);
```

Waits for [`TEST_PROVIDERS_READY_ID`](render.tsx) so async hydration finished. Use `renderWithSharedQueryClient` when asserting cache/stale behavior.

### Expo Router

[`setup.ts`](setup.ts) mocks `expo-router` and exposes `globalThis.__expoRouterMocks` (`push`, `back`, `replace`, `dismissTo`, `params`). Clear mocks in `beforeEach`:

```ts
const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: { replace: ReturnType<typeof mock> };
};
beforeEach(() => __expoRouterMocks.replace.mockClear());
```

### Per-test native mocks

Keep file-local `mock.module` when only one suite needs them (e.g. [`ScanScreen.test.tsx`](../src/screens/ScanScreen.test.tsx) → `expo-camera`). Do not add to global setup unless widely used.

### `UNSAFE_getByType`

Avoid when possible; use accessibility labels/text. Acceptable for asserting `disabled` on underlying `TouchableOpacity` when not exposed otherwise.

---

## jest-expo coverage audit

What **jest-expo** typically provides vs this repo (Bun preload):

| Area | jest-expo | This repo |
|------|-----------|-----------|
| Expo SDK modules | Auto-mocked | Partial: `expo-secure-store`, `expo-localization`, `expo-clipboard` in setup/mocks |
| Assets (png/svg) | Stubbed | [`mocks/assets.ts`](mocks/assets.ts) |
| `react-native` core | Preset environment | Large hand-rolled mock in [`setup.ts`](setup.ts) |
| `react-native-svg` | Often covered | Custom mock in setup |
| `expo-router` | Community recipes / manual | Custom mock + `__expoRouterMocks` |
| `@react-navigation/native` | Partial via preset | `useFocusEffect` mock in setup |
| `expo-camera` | Mocked in preset | Per-test in `ScanScreen.test.tsx` |
| API / app logic | N/A | [`mocks/api-client.ts`](mocks/api-client.ts) (app-specific) |
| Lucide icons | N/A | Inline mock in setup |

**Gaps to fill incrementally on Bun** (before considering Jest): `expo-camera` (if more screens use it), any new Expo modules after SDK bumps — check [jest-expo source](https://github.com/expo/expo/tree/main/packages/jest-expo/src/preset) for reference implementations.

---

## Framework evaluation

### Bun + RNTL (current)

- Fast CI; same runner as `packages/api`.
- Full control over mocks; documented patterns above.
- Maintenance cost for RN/Expo stubs; off Expo’s default docs path.

### Jest + jest-expo + RNTL

- Official Expo 55 path; likely **shrinks** `setup.ts`.
- Migration: all `bun:test` → Jest, `mock.module` → `jest.mock` / `jest.unstable_mockModule`, new `jest.config`, coverage config move.
- **Spike not run** (decision: stay). Suggested spike if revisiting: port `session.test.ts`, `Button.test.tsx`, `LoginScreen.test.tsx`; compare setup line count and CI duration against baseline above.

### Vitest + vitest-native + RNTL

- Theoretical DX win; **immature** for Expo 55 / RN 0.83. Not recommended unless standardizing on Vitest monorepo-wide.

### Out of scope

Detox, Maestro, Appium, `vitest-mobile` — real device/emulator testing, not replacements for current unit/integration tests.

---

## Adding a new test

1. Colocate `*.test.ts` or `*.test.tsx` under `src/` (or `test/routes/` for route entries).
2. Import `describe` / `it` / `expect` from `bun:test`.
3. Use preload mocks when possible; otherwise `mock.module` then `await import()` the subject.
4. UI: `renderWithProviders` + `@testing-library/react-native` queries.
5. Run `bun run test` before opening a PR (CI matrix: lint, typecheck, test).
