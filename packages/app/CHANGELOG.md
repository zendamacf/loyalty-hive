# @loyalty-hive/app

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
