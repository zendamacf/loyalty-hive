# @loyalty-hive/app

## 1.2.0

### Minor Changes

- d05876f: Add Umami custom event tracking for auth, card management, search, sort, and settings actions.
- 7b394d8: Added Umami for basic analytics tracking of screen views.
- abc68a7: Added brand request flow so users can request missing loyalty brands with a required program URL, optional notes, and an optional linked custom card for future brand migration. Tracks `brand_request_submitted` in Umami analytics.

### Patch Changes

- 2ea9c60: Add CI guards for Android bundle smoke, Expo SDK alignment, Hermes runtime APIs, and expo-router import restrictions.
- 5edaf60: Identify user in Umami on login & resume.

## 1.1.10

### Patch Changes

- c46f4cf: Fixed all API requests failing due to missing crypto dependency.
- 66ff39d: Regenerates API SDK for new '/api/v1/auth/me` endpoint.

## 1.1.9

### Patch Changes

- a0d178a: Show the correct invalid credentials error message on login.
- ef16afb: Add client identification headers for API Sentry errors. The app sends `x-client-id`, `x-app-version`, `x-app-build`, and `x-app-platform` on API requests; the API enriches Sentry with these values as tags and context.
- ef16afb: Add `x-request-id` and `x-os-version` headers for API Sentry context. Each request gets a unique request ID for correlation, and the OS version is included for platform-specific debugging.

## 1.1.8

### Patch Changes

- 486184d: Align app native animation dependencies with Expo SDK 57 bundled versions (gesture-handler, reanimated, worklets) so the development client matches Metro, and exclude those packages from Dependabot auto-upgrades.
- 2086086: Fixed view code screen crashing.
- fa7321c: Fixes render errors not being reported to Sentry.
- 0191a9f: Fix Android EAS build failure by downgrading react-native from 0.87.0 to 0.86.2 for Expo SDK 57 compatibility.

## 1.1.7

### Patch Changes

- 5cad336: Updated hono, @biomejs/biome, @sentry/react-native, babel-preset-expo, expo, expo-dev-client, expo-router, expo-splash-screen, react-native, react-native-gesture-handler, react-native-safe-area-context, react-native-worklets (version-update:semver-minor).
- eb3ec14: Fixes auto-tagging CI workflow not triggering downstream tag-based build/publish workflows.

## 1.1.6

### Patch Changes

- Fixes builds failing on missing eas script.

## 1.1.5

### Patch Changes

- 10a8989: Fix Android EAS build failures caused by an incompatible react-native-worklets version pulled in transitively by react-native-actions-sheet. Pin Worklets 0.11.4, add a native dependency check and expo-doctor to PR CI, and use Bun's hoisted linker so dependency validation passes in the monorepo.

## 1.1.4

### Patch Changes

- Prevents Android builds failing due to mismatching versions.

## 1.1.3

### Patch Changes

- 827237a: Updated @hono/zod-validator, @biomejs/biome, @types/node, typescript, @react-native-async-storage/async-storage, @sentry/react-native, expo, expo-localization, expo-splash-screen, react-native-gesture-handler, @testing-library/react-native, eas-cli (version-update:semver-major).
- bd185bd: Updated hono, @biomejs/biome, @types/node, @react-navigation/native, @sentry/react-native, @tanstack/react-query, babel-preset-expo, expo-clipboard, expo-dev-client, expo-localization, expo-router, expo-secure-store, expo-splash-screen, i18next, lucide-react-native, react-native-reanimated, @testing-library/react-native, eas-cli (version-update:semver-major).
- f03bd70: Updated pg, @biomejs/biome, @types/node, @hey-api/openapi-ts, @sentry/react-native, expo, lucide-react-native, react-native-gesture-handler, eas-cli (version-update:semver-major).
- 59b91eb: Updated @changesets/cli, @hono/standard-validator, @hono/zod-validator, hono, @biomejs/biome, @types/node, tsx, typescript, @react-navigation/native, @sentry/react-native, @tanstack/react-query, babel-preset-expo, expo, expo-brightness, expo-camera, expo-clipboard, expo-dev-client, expo-localization, expo-router, expo-secure-store, expo-splash-screen, expo-status-bar, i18next, lucide-react-native, react-i18next, react-native-gesture-handler, react-native-reanimated, eas-cli (version-update:semver-major).
- 680da50: Updated hono, hono-openapi, @biomejs/biome, @types/node, tsx, @react-navigation/native, @sentry/react-native, babel-preset-expo, expo, expo-dev-client, expo-router, expo-splash-screen, i18next, lucide-react-native, react-native-reanimated, eas-cli (version-update:semver-major).
- 8c9482e: Updated @hono/standard-validator, hono, pg, @types/pg, @biomejs/biome, @types/node, @types/pg, tsx, @react-navigation/native, @sentry/react-native, @tanstack/react-query, babel-preset-expo, expo, expo-dev-client, expo-router, expo-splash-screen, lucide-react-native, react, @types/react, react-i18next, react-native, react-native-reanimated, react-native-safe-area-context, @types/react, eas-cli, react-native-dotenv (version-update:semver-major).
- 07833be: Updated expo-brightness from 56.0.5 to 57.0.0 (version-update:semver-major).
- 19edab9: Updated expo-camera from 55.0.19 to 57.0.0 (version-update:semver-major).
- 3ac9ff5: Updated expo-clipboard from 55.0.13 to 56.0.4 (version-update:semver-major).
- 9ac9dab: Updated expo-dev-client from 55.0.35 to 56.0.20 (version-update:semver-major).
- 0bb1c37: Updated expo-router from 55.0.14 to 56.2.11 (version-update:semver-major).
- 45eba19: Updated expo-secure-store from 55.0.14 to 56.0.4 (version-update:semver-major).
- de31c8c: Updated expo-status-bar from 55.0.6 to 57.0.0 (version-update:semver-major).
- 53e7a5a: Updated react-native-reanimated from 4.2.1 to 4.4.1 (version-update:semver-minor).
- 98e2b3f: Updated react-native-safe-area-context from 5.6.2 to 5.8.0 (version-update:semver-minor).
- e8a217d: Updated react-native-svg from 15.15.3 to 15.15.5 (version-update:semver-patch).
- 0024cc3: Updated react-native-svg-transformer from 1.5.2 to 1.5.3 (version-update:semver-patch).
- 5dac1e8: Updated react from 19.2.0 to 19.2.7, react-test-renderer from 19.2.0 to 19.2.7 (version-update:semver-patch).
- fc9a2b2: Updated babel-preset-expo from 55.0.22 to 56.0.15 (version-update:semver-major).
- fb93494: Updated expo-brightness from 55.0.13 to 56.0.5 (version-update:semver-major).
- edc3c84: Updated expo-clipboard from 55.0.13 to 56.0.4 (version-update:semver-major).
- 78d0a9c: Updated @hey-api/openapi-ts from 0.97.3 to 0.98.2 (version-update:semver-minor).
- ec099b5: Updated react-native from 0.83.6 to 0.86.0 (version-update:semver-minor).
- 08fc453: Added CI workflow to automatically create changesets for Dependabot pull requests.

## 1.1.2

### Patch Changes

- 3aa1fea: Improved scannability of displayed barcodes & QR codes by reducing UI elements, and shrinking the QR code.
- bf3f8c7: Added test coverage reporting in CI.
- 3aa1fea: Replaces cards screen logo with transparent version.

## 1.1.1

### Patch Changes

- Fixes incorrect build version being used for Android.

## 1.1.0

### Minor Changes

- 322777d: \* Added a Manage section with bottom sheets on the card code screen for details, editing, and deleting.
  - Removed card settings screen.
  - Replaced manual entry screen with a bottom sheet.
- a312d8f: Refactored theming to support multiple distinct palettes.
- a312d8f: Add a Purple theme.
- a312d8f: Added a System theme that follows the device's light or dark theme.

### Patch Changes

- a312d8f: Added reusable `Form` and `FormGroup` components for vertical labeled fields.
- ce1c80a: Updates app icon & splash screen.
- 2eb44a4: Added display of set label on branded cards.
- 81ccd91: Added border to cards & brands to stop some of them blending with the background.
- 9d3af81: Hardened Bun test suites for the API and Expo app (taxonomy, docs, coverage, act-safe interactions).
- cda71ec: Added increase of screen brightness while viewing a card's barcode.
- 50b4008: Updated URL for API client generation.

## 1.0.1

### Patch Changes

- 6e75704: \* Added card list sorting dropdown.
  - Switched language selection to a dropdown.
- 998d9b5: Fixed "Added on" date not showing in card details screen.
- 3e38511: \* Added scan guide depending on which barcode type you're expected to be scanning based on the brand.
  - Refactored scan screen to no longer use a full screen camera. Manual entry has been moved to a dedicated screen.

## 1.0.0

### Major Changes

- 2aeca6f: Set up Android builds.

### Minor Changes

- c9b0ec0: Added x-api-key headers to auth API requests.

### Patch Changes

- 7bfaaee: Added persistent auth session to prevent forced logins between app restarts.
- 71a0cca: Added caching of API responses when fetching lists of cards & brands.
- 1f56581: Added a card settings page including card deletion. Card number copy functionality has been moved here.
- 762994d: Added signout handler for unauthorized API responses.
- 82e90d1: Fixed API URL not obeying configuration.
- 82e90d1: Fixed AsyncStorageError's showing on various screens.
- 82e90d1: Added show/hide buttons to the password field on the login screen.
- 94f91f0: Fixed card & branch list items not rendering on Android.
- 82e90d1: Fixed input fields being covered by the device keyboard.
- 82e90d1: Fixed white background behind Android navigation.
- 1f56581: Added shared `ScreenShell` component to make screen layouts consistent.

## 0.0.1

- Initial MVP of React Native app. Features include login, signup, and card creation/listing/viewing.
