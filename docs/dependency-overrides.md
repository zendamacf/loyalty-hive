# Root `package.json` dependency overrides

Bun reads `overrides` only from the **repository root** `package.json` (not workspace packages). They force a single resolved version for transitive dependencies across the monorepo.

See [Bun overrides](https://bun.com/docs/pm/overrides).

## `react-native-worklets` → `0.10.1`

`react-native-actions-sheet` depends on `react-native-worklets@^0.7.1`, which can pull a Worklets version incompatible with **Reanimated 4** (peer requires `0.10.x`). Reanimated enforces this at Android Gradle build time, so the mismatch may not show up in lint or unit tests.

- Introduced in [#93](https://github.com/zendamacf/loyalty-hive/pull/93) (originally pinned `0.11.4`).
- Updated to `0.10.1` in [#105](https://github.com/zendamacf/loyalty-hive/pull/105) to match Expo SDK 57 bundled native modules and Reanimated `4.5.1`.
- CI guard: `packages/app/scripts/check-native-deps.ts` (also run via `bun run doctor`).

## `@expo/log-box` → `57.0.4`

**TBC** — added in [#93](https://github.com/zendamacf/loyalty-hive/pull/93) when switching to Bun’s hoisted linker; no separate write-up of the original failure.

## `expo-constants` → `57.0.19`

Pin one Expo SDK 57 version for `expo-constants` across the tree so transitive packages do not install a different patch (e.g. `expo` vs `expo-linking` / `expo-asset` ranges).

- Introduced at `57.0.18` in [#93](https://github.com/zendamacf/loyalty-hive/pull/93).
- Bumped to `57.0.19` in [#105](https://github.com/zendamacf/loyalty-hive/pull/105) to match `packages/app`’s direct dependency.

## Expo Umami transitive native modules

`@bitte-kaufen/expo-umami` (installed from GitHub) declares several Expo/RN packages as **regular `dependencies`** with older ranges (`async-storage@^1.23`, `expo-localization@^17`, etc.). Without overrides, Bun can nest duplicate copies under `node_modules/@bitte-kaufen/expo-umami/node_modules/`, and **expo-doctor** fails its duplicate native-module check.

These overrides force expo-umami (and everything else) to use the same versions as `packages/app` on Expo SDK 57:

| Override | App version |
|----------|-------------|
| `@react-native-async-storage/async-storage` | `2.2.0` |
| `expo-application` | `~57.0.1` |
| `expo-device` | `~57.0.1` |
| `expo-localization` | `~57.0.1` |

`expo-constants` is already pinned above. No changes to the expo-umami package are required.
