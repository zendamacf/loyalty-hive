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

For CI, create an [Expo access token](https://expo.dev/accounts/[account]/settings/access-tokens) and set `EXPO_TOKEN` in GitHub secrets.

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

## Sentry

The `@sentry/react-native/expo` plugin in `app.json` uses organization `kalopsiadev` and project `loyalty-hive`. After a production build with `SENTRY_AUTH_TOKEN` set, confirm debug symbols appear in Sentry for that release.
