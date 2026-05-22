# @loyalty-hive/api

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
