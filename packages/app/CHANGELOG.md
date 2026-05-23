# @loyalty-hive/app

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
