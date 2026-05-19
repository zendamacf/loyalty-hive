# EAS Build setup

Android release builds use [EAS Build](https://docs.expo.dev/build/introduction/). Run all commands from `packages/app`.

## One-time setup

### 1. Log in and link the project

```sh
cd packages/app
bunx eas login
bunx eas init
```

`eas init` creates/links the Expo project and writes `expo.extra.eas.projectId` into [`app.json`](app.json). Commit that change.

For CI, create an [Expo access token](https://expo.dev/accounts/[account]/settings/access-tokens) and set `EXPO_TOKEN` in GitHub secrets. The [`app-android-build.yml`](../../.github/workflows/app-android-build.yml) workflow uses it to run `eas build` non-interactively.

### 2. Configure EAS secrets

`EXPO_PUBLIC_*` values are inlined at **build time**. Set them as project secrets (not in git):

```sh
bunx eas secret:create --name EXPO_PUBLIC_API_URL --value "https://YOUR_PRODUCTION_API" --scope project
bunx eas secret:create --name EXPO_PUBLIC_API_KEY --value "YOUR_PRODUCTION_API_KEY" --scope project
bunx eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "YOUR_SENTRY_DSN" --scope project
bunx eas secret:create --name SENTRY_AUTH_TOKEN --value "YOUR_SENTRY_AUTH_TOKEN" --scope project
```

| Secret | Purpose |
|--------|---------|
| `EXPO_PUBLIC_API_URL` | Production API base URL (**HTTPS** required for Android release) |
| `EXPO_PUBLIC_API_KEY` | App API key (embedded in the client bundle) |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for release crash reporting |
| `SENTRY_AUTH_TOKEN` | Uploads source maps during EAS builds ([Sentry auth token](https://sentry.io/settings/account/api/auth-tokens/)) |

List secrets: `bunx eas secret:list`

Production API credentials must exist before preview/production builds are useful (see repo `TODO.md`).

## Build profiles

Defined in [`eas.json`](eas.json):

| Profile | Output | Use |
|---------|--------|-----|
| `development` | APK + dev client | Device testing with native modules (`expo-dev-client`) |
| `preview` | APK | Internal QA |
| `production` | AAB | Google Play Store |

`cli.appVersionSource: "remote"` lets EAS manage `android.versionCode` on production builds.

## Run builds

```sh
# QA APK (internal distribution)
bun run build:android:preview

# Play Store bundle
bun run build:android:production

# Dev client APK
bunx eas build --platform android --profile development
```

Download artifacts from the [Expo dashboard](https://expo.dev) or the CLI link printed when the build finishes.

## Signing (Android)

Release Android builds need a signing key. Use **EAS-managed credentials** unless you have a strong reason not to — EAS generates, stores, and uses the upload keystore for every production build.

### Generate the upload keystore (one-time)

```sh
cd packages/app
bunx eas credentials --platform android
```

In the interactive menu:

1. Choose the `production` build profile.
2. Select **Keystore: Manage everything needed to build your project** → **Set up a new keystore**.

EAS creates an upload keystore and stores it on the EAS servers. The first `eas build --profile production` will also offer to generate one if you skipped this step.

### Back up the keystore

```sh
bunx eas credentials --platform android
# → Keystore → Download credentials
```

Save the resulting `.jks` file and the printed passwords somewhere durable (1Password, etc.). Losing this key while not using Play App Signing means **you cannot update the app on the Play Store ever again**.

### Play App Signing

Enable **[Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)** when creating the app in Play Console (it is the default for new apps). Two keys are involved:

| Key | Held by | Used for |
|-----|---------|----------|
| **Upload key** | EAS (the keystore above) | Signing AABs you upload to Play |
| **App signing key** | Google | Re-signing what end users install |

If your upload key is ever lost or compromised, Google can issue a new one — but only when Play App Signing is enabled. Always keep it enabled.

When Play Console asks for the upload certificate during app setup, run:

```sh
bunx eas credentials --platform android
# → Keystore → View keystore fingerprints
```

…and provide the **SHA-1** and **SHA-256** fingerprints (or upload the certificate `.pem` if it asks for that).

### Verify before the first store upload

- [ ] `bunx eas credentials --platform android` shows a keystore for the `production` profile.
- [ ] Keystore backup downloaded and stored securely.
- [ ] Play Console app created with **Play App Signing** enabled.
- [ ] Upload certificate fingerprint registered in Play Console matches `eas credentials` output.

## Sentry

The `@sentry/react-native/expo` plugin in `app.json` uses organization `kalopsiadev` and project `loyalty-hive`. After a production build with `SENTRY_AUTH_TOKEN` set, confirm debug symbols appear in Sentry for that release.
