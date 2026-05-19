# EAS Build setup

Android release builds use [EAS Build](https://docs.expo.dev/build/introduction/). Run all commands from `packages/app`.

## One-time setup

### 1. Log in and link the project

```sh
cd packages/app
bunx eas login
bunx eas init
```

### 2. Configure EAS secrets

`EXPO_PUBLIC_*` values are inlined at **build time**. Set them as project secrets:

```sh
# Repeat for each required environment variable
bunx eas secret:create --name FOO --value "BAR" --scope project
```

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

## Sentry

The `@sentry/react-native/expo` plugin in `app.json` uses organization `kalopsiadev` and project `loyalty-hive`. After a production build with `SENTRY_AUTH_TOKEN` set, confirm debug symbols appear in Sentry for that release.
