# @loyalty-hive/api

## 1.5.0

### Minor Changes

- e1d1dae: Add account deletion: `DELETE /api/v1/auth/me` with the current password. The account is closed at once, and its data is removed for good after 30 days.
- ac88ace: Add admin login for the admin panel: `POST /api/v1/admin/auth/login`, `POST /api/v1/admin/auth/logout`, and `GET /api/v1/admin/auth/me`. The session is in an httpOnly cookie. Set `ADMIN_JWT_SECRET` to a value different from `JWT_ACCESS_SECRET` to turn on admin login. These routes are not in the public API docs.
- 13af3d1: Add `GET /api/v1/admin/brand-requests` for admins. It lists brand requests from all users, with an optional status filter and pages (`limit`, `offset`).
- 061277a: Add the `admin_users` table for admin panel accounts. Admin accounts are separate from app users. Use `bun run admin:create <email>` to create an admin.
- 86aab4b: Add a Users page to the admin panel. It lists app users with email search and filters for account status and email verification. Add `GET /api/v1/admin/users` for admins.
- c607614: Add sign-up email verification: verification and resend endpoints, Resend-backed mail delivery, and block unverified users from card and brand APIs until verified.
- 66895f9: Add password reset: request and confirm endpoints, a reset email, and revocation of all existing sign-in tokens when the password changes.
- 58724b4: Serve the admin panel at `/admin`. The Docker image now includes the admin panel build.

### Patch Changes

- 3b25b92: Make the buttons in verification and password reset emails work in Gmail. Email links now go to the API, which redirects to the app, because Gmail removes direct app links. Set the new `BASE_URL` to the API's public URL to turn this on. Brand logos are also served from `BASE_URL` now, and `FILE_STORAGE_URL` becomes an optional override. `APP_DEEP_LINK_BASE` can point the redirect at a development build such as Expo Go.
- bb3b205: Improve error reporting: each server error is now reported once instead of twice, reports show which API version they came from, and failures in the daily account cleanup and unhandled promise rejections are now reported too.
- bb3b205: Add more detail to error reports: each report now lists the database queries the request ran (without their values), whether the user or admin was authenticated, and any emails sent.
- bb3b205: Stop reporting expected errors to Sentry, such as a missing login, an unverified email, a deleted account, or invalid input. Only server errors are reported now.

## 1.4.0

### Minor Changes

- a33bdea: Add Mitre 10 Club, Spotlight VIP Club, IKEA Family, Cinebuzz Rewards and SuperGold Card as brands.

### Patch Changes

- 6760296: Remove the Subway, New World and PAK'nSAVE brands. Subcard closed, and Club+ replaced the New World Clubcard. Rename Air New Zealand to Air New Zealand Koru. Existing cards keep their data.
- ef54cac: Make the Docker image smaller. Use the Alpine base image. Install only production dependencies.

## 1.3.0

### Minor Changes

- 6fda9fd: Add in-memory rate limiting on auth login and signup routes (per IP and per email on login), configurable via `RATE_LIMIT_AUTH_*` environment variables. Exceeded limits return HTTP 429 with a JSON error body.
- 6efe42d: Access tokens now include expiration (`exp` / `iat`). Configure lifetime with `JWT_ACCESS_TTL` (default 7 days). There is no refresh token — sign in again when a token expires.
- 1eddae8: Sign-up now requires passwords of at least 12 characters with uppercase, lowercase, and numeric characters. Login is unchanged for existing accounts.

### Patch Changes

- 734ca62, 0485165, c06e2b3: Updated hono (version-update:semver-minor).
- 734ca62, c06e2b3, 0ff3f92: Updated dotenv (version-update:semver-minor).
- 734ca62: Updated pg (version-update:semver-minor).
- 734ca62, 669a968, 4cc6970, b5eb68b, 0ff3f92: Updated @biomejs/biome (version-update:semver-minor).
- c06e2b3: Updated @types/node (version-update:semver-major).

## 1.2.1

### Patch Changes

- 26c17f4, 300f90e: Updated @biomejs/biome (version-update:semver-patch).
- 300f90e: Updated hono, @types/pg, bun-types (version-update:semver-minor).

## 1.2.0

### Minor Changes

- abc68a7: Added brand request endpoint so users can request missing loyalty brands.

## 1.1.0

### Minor Changes

- 66ff39d: Added `/api/v1/auth/me` endpoint for retrieving current user's details.

## 1.0.3

### Patch Changes

- ef16afb: Add client identification headers for API Sentry errors. The app sends `x-client-id`, `x-app-version`, `x-app-build`, and `x-app-platform` on API requests; the API enriches Sentry with these values as tags and context.
- ef16afb: Add `x-request-id` and `x-os-version` headers for API Sentry context. Each request gets a unique request ID for correlation, and the OS version is included for platform-specific debugging.

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
