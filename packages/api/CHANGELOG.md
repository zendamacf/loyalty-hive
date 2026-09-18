# @loyalty-hive/api

## 1.0.2

### Patch Changes

- 486184d: Make the API listen host configurable via `HOSTNAME`.

## 1.0.1

### Patch Changes

- 5cad336: Updated hono, @biomejs/biome, @sentry/react-native, babel-preset-expo, expo, expo-dev-client, expo-router, expo-splash-screen, react-native, react-native-gesture-handler, react-native-safe-area-context, react-native-worklets (version-update:semver-minor).
- eb3ec14: Fixes auto-tagging CI workflow not triggering downstream tag-based build/publish workflows.
- 27eb03a: Fixes logo URLs returning 404 responses.

## 1.0.0

### Major Changes

- 6fc65db: Self-host with Docker Compose instead of Vercel.

## 0.2.2

### Patch Changes

- 827237a: Updated @hono/zod-validator, @biomejs/biome, @types/node, typescript, @react-native-async-storage/async-storage, @sentry/react-native, expo, expo-localization, expo-splash-screen, react-native-gesture-handler, @testing-library/react-native, eas-cli (version-update:semver-major).
- bd185bd: Updated hono, @biomejs/biome, @types/node, @react-navigation/native, @sentry/react-native, @tanstack/react-query, babel-preset-expo, expo-clipboard, expo-dev-client, expo-localization, expo-router, expo-secure-store, expo-splash-screen, i18next, lucide-react-native, react-native-reanimated, @testing-library/react-native, eas-cli (version-update:semver-major).
- f03bd70: Updated pg, @biomejs/biome, @types/node, @hey-api/openapi-ts, @sentry/react-native, expo, lucide-react-native, react-native-gesture-handler, eas-cli (version-update:semver-major).
- 59b91eb: Updated @changesets/cli, @hono/standard-validator, @hono/zod-validator, hono, @biomejs/biome, @types/node, tsx, typescript, @react-navigation/native, @sentry/react-native, @tanstack/react-query, babel-preset-expo, expo, expo-brightness, expo-camera, expo-clipboard, expo-dev-client, expo-localization, expo-router, expo-secure-store, expo-splash-screen, expo-status-bar, i18next, lucide-react-native, react-i18next, react-native-gesture-handler, react-native-reanimated, eas-cli (version-update:semver-major).
- 680da50: Updated hono, hono-openapi, @biomejs/biome, @types/node, tsx, @react-navigation/native, @sentry/react-native, babel-preset-expo, expo, expo-dev-client, expo-router, expo-splash-screen, i18next, lucide-react-native, react-native-reanimated, eas-cli (version-update:semver-major).
- 8c9482e: Updated @hono/standard-validator, hono, pg, @types/pg, @biomejs/biome, @types/node, @types/pg, tsx, @react-navigation/native, @sentry/react-native, @tanstack/react-query, babel-preset-expo, expo, expo-dev-client, expo-router, expo-splash-screen, lucide-react-native, react, @types/react, react-i18next, react-native, react-native-reanimated, react-native-safe-area-context, @types/react, eas-cli, react-native-dotenv (version-update:semver-major).
- dfbd467: Updated @hono/standard-validator from 0.2.2 to 0.2.3 (version-update:semver-patch).
- 3ba07ee: Updated bcryptjs, @types/bcryptjs (version-update:semver-major).
- 08fc453: Added CI workflow to automatically create changesets for Dependabot pull requests.

## 0.2.1

### Patch Changes

- bf3f8c7: Added test coverage reporting in CI.

## 0.2.0

### Minor Changes

- db2ec28: Added soft deletion of `cards` records.
- 50b4008: Added new Swagger UI homepage with API documentation.
- 322777d: Added PATCH endpoint for updating a card's label and default view (1D/2D).

### Patch Changes

- 4ca1fb3: Added new brand Club+.
- 9d3af81: Hardened Bun test suites for the API and Expo app (taxonomy, docs, coverage, act-safe interactions).
- 81ccd91: Updated all brand logos to use cropped versions for more consistent sizing.

## 0.1.1

### Patch Changes

- 6e75704: \* Added card view stats, which are updated when views are logged via the API.
  - Added sort order query parameters when fetching a list of a user's cards.
- 358bbfc: Improved speed of API key & password verification by reducing the bcrypt rounds from 12 to 10.
- 57aa912: Adds new brands:
  - [Mecca](https://www.mecca.com/)
- 3e38511: Added a default barcode view type (1D, 2D) to brands.

## 0.1.0

### Minor Changes

- c9b0ec0: Added `x-api-key` header requirement to all auth routes.

### Patch Changes

- 82e90d1: Replaced localhost URL in OpenAPI with development proxy URL.

## 0.0.1

- Created MVP of Hono API with routes for login, signup, brands, plus card creation/fetching/deletion.
- Setup initial database schema with a small number of seeded brands.
- Added OpenAPI JSON exposed via API.
