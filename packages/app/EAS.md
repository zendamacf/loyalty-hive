# EAS Build setup

Android release builds use [EAS Build](https://docs.expo.dev/build/introduction/). Run all commands from `packages/app`.

## One-time setup

### 1. Log in and link the project

```sh
cd packages/app
bun x eas-cli login
bun x eas-cli init
```

### 2. Configure EAS secrets

`EXPO_PUBLIC_*` values are inlined at **build time**. Set them as project secrets:

```sh
# Repeat for each required environment variable
bun x eas-cli secret:create --name FOO --value "BAR" --scope project
```

## Run builds

```sh
# QA APK (internal distribution)
bun run build:android:preview

# Play Store bundle
bun run build:android:production

# Dev client APK
bun x eas-cli build --platform android --profile development
```

Download artifacts from the [Expo dashboard](https://expo.dev) or the CLI link printed when the build finishes.

## Signing (Android)

Release Android builds need a signing key. Use **EAS-managed credentials** unless you have a strong reason not to — EAS generates, stores, and uses the upload keystore for every production build.

## Android R8 minification

Release builds (`preview` and `production`) enable R8 through `expo-build-properties` in `app.json`. R8 minifies and obfuscates native Java/Kotlin code and reduces app size. The `development` profile is not affected.

After you enable R8 on a new release, smoke-test a preview APK on a real device (launch, camera, navigation, auth) before you ship production.

If Play Console warns that no deobfuscation file is associated with the bundle, check App bundle explorer for the release. With AAB and R8, Google usually extracts the mapping automatically.

## Sentry

The `@sentry/react-native/expo` plugin in `app.json` uses organization `kalopsiadev` and project `loyalty-hive`.

Required EAS environment variables (set per environment: `production`, `preview`, `development`):

- `EXPO_PUBLIC_SENTRY_DSN` — inlined into the JS bundle at build time; without it, production builds send no events.
- `SENTRY_AUTH_TOKEN` — uploads JS source maps, native ProGuard mapping files, native symbols, and native sources during the build so stack traces are readable in Sentry.

The `experimental_android` option of the plugin turns on the Sentry Android Gradle plugin. With R8 enabled, it uploads ProGuard mappings for native crashes. It also uploads native symbols and native sources. JS/Hermes source maps are not changed.

Route-level render errors (e.g. a screen throwing on mount) are captured via `Sentry.wrapExpoRouterErrorBoundary` in `app/_layout.tsx`.

## Umami analytics

Screen views are tracked with `trackScreenView()` from `@bitte-kaufen/expo-umami`. Umami is initialized in `app/_layout.tsx` and disabled in development (`__DEV__`).

Required EAS environment variables for production/preview builds:

- `EXPO_PUBLIC_UMAMI_HOST` — your Umami instance URL (e.g. `https://cloud.umami.is` or a self-hosted URL).
- `EXPO_PUBLIC_UMAMI_WEBSITE_ID` — the website ID from your Umami dashboard.

If either variable is missing, analytics initialization is skipped and screen tracking calls are no-ops.
