# packages/app tests

Unit, component, and integration tests for the Expo app. No device/e2e runner — tests run in Node via Bun with mocked React Native and Expo modules.

## Stack

| Layer | Choice |
|-------|--------|
| Runner | `bun test` with `--preload ./test/setup.ts --isolate` |
| API | `bun:test` |
| UI queries/events | `@testing-library/react-native` |
| Coverage | `packages/app/bunfig.toml` |

CI runs `bun run test` from [`.github/workflows/app-pr-checks.yml`](../../.github/workflows/app-pr-checks.yml).

## Layout

| Path | Role |
|------|------|
| [`setup.ts`](setup.ts) | Preload: global RN/navigation mocks + imports [`mocks/*`](mocks/) |
| [`render.tsx`](render.tsx) | `renderWithProviders`, shared QueryClient, provider hydration |
| [`mocks/`](mocks/) | Module mocks loaded before tests |
| [`fixtures/`](fixtures/) | Shared API response shapes (`cards`, `brands`) |
| [`routes/`](routes/) | Expo Router entry tests |
| `src/**/*.unit.test.ts(x)` | Pure logic, hooks, or isolated providers |
| `src/**/*.component.test.tsx` | Single component / hook probe with bare `render()` |
| `src/**/*.integration.test.tsx` | Full provider harness, screens, routes |

## Test taxonomy

Colocate tests next to source. Use a **filename suffix** and a matching **`describe` tag** on the top-level block.

| Tag | Filename suffix | When to use |
|-----|-----------------|-------------|
| `[Unit]` | `.unit.test.ts` / `.unit.test.tsx` | Pure logic (no RNTL), or `renderHook` / one provider with a narrow wrapper (no `TestProviders` stack) |
| `[Component]` | `.component.test.tsx` | RNTL `render()` only — one component or hook probe, no auth/i18n/query/overlay harness |
| `[Integration]` | `.integration.test.tsx` | `renderWithProviders` or `renderWithSharedQueryClient` |

Examples:

```ts
describe("[Unit] auth session", () => { /* ... */ });
describe("[Component] Button", () => { /* ... */ });
describe("[Integration] LoginScreen", () => { /* ... */ });
```

Classify by **harness**, not assertion count: e.g. `FormGroup` uses the full stack → integration even if it only checks static copy.

## Running tests

```bash
cd packages/app
bun run test
```

## Patterns

### `renderWithProviders`

Prefer over bare `render` when the tree needs auth, i18n, preferences, React Query, or overlays:

```ts
const { getByText } = await renderWithProviders(<SettingsScreen />);
```

### `press`, `changeText`, and `flushAct`

From [`render.tsx`](render.tsx) for interactions that update React state outside the event handler:

- **Integration tests:** prefer `await press(element)` and `await changeText(element, text)` over raw `fireEvent`.
- **Component tests:** raw `fireEvent` is fine for simple synchronous handlers (e.g. `Button.component.test.tsx`).
- `await press(element, { flushLayout: false })` — for async mutations where flushing skips transient UI.
- Use raw `fireEvent` for non-press events (`submitEditing`, `onBarcodeScanned`, etc.).

### Expo Router mocks

Use [`getExpoRouterMocks()`](mocks/expo-router.ts) instead of casting `globalThis`:

```ts
import { getExpoRouterMocks } from "../../test/mocks/expo-router";

const expoRouterMocks = getExpoRouterMocks();
expoRouterMocks.push.mockClear();
```

### Shared fixtures

Import card/brand lists from [`fixtures/`](fixtures/) in screen tests that mock the API client.

### Per-test native mocks

Keep file-local `mock.module` when only one suite needs them (e.g. [`ScanScreen.integration.test.tsx`](../src/screens/ScanScreen.integration.test.tsx) → `expo-camera`).

### Dynamic `await import()`

Use when a screen imports side effects or needs mocks registered in the same file before load.
