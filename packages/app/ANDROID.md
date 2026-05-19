# Android local development

`bun run start:android` only opens **Expo Go**, which does not include this app's native modules (Sentry, camera, secure store). Use the steps below to build and run a real debug APK on your machine.

For release builds (Play Store), see [`EAS.md`](EAS.md).

## Host prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| JDK | 17 | `JAVA_HOME` must point at it |
| Android SDK | API 36 (Android 15) | required to compile RN 0.83 / Expo SDK 55 |
| Android SDK Build-Tools | latest matching | installed via Android Studio SDK Manager |
| Android Emulator or device | API 24+ (Android 7) | physical device needs USB debugging enabled |
| Watchman | latest | file watcher used by Metro |

### Environment variables

```sh
export ANDROID_HOME="$HOME/Android/Sdk"            # path varies by OS
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

### Linux notes

```sh
sudo apt install openjdk-17-jdk watchman
# Install Android Studio and use SDK Manager to add API 36 + build-tools.
```

Reference: [Expo: Set up your environment](https://docs.expo.dev/get-started/set-up-your-environment/?buildEnv=local&device=physical&mode=development-build&platform=android).

## First-time setup

```sh
cd packages/app
bun install
cp .env.example .env        # local API URL is fine for debug
```

## Run a native debug build

```sh
# 1. Regenerate the native android/ project (only when app.json plugins/config change)
bun run android:prebuild

# 2. Compile + install on the connected emulator or device
bun run android:run
```

`android:run` will start Metro and install a debug APK. Subsequent runs only need `bun run android:run` (or just `bun run start` once the dev client is installed).

## What gets regenerated

`bun run android:prebuild` runs `expo prebuild --platform android --clean`, which:

- Creates `packages/app/android/` from [`app.json`](app.json) + config plugins (`expo-router`, `expo-camera`, `@sentry/react-native/expo`).
- Overwrites any local changes to native files. **Do not hand-edit `packages/app/android/`** — change `app.json` or add a config plugin instead.

`packages/app/android/` is gitignored.

## Troubleshooting

- **`SDK location not found`** — `ANDROID_HOME` is unset; export it before running.
- **`JAVA_HOME is not set`** — install JDK 17 and export `JAVA_HOME`.
- **`Camera permission denied` on device** — make sure [`expo-camera`](app.json) is in the `plugins` list and re-run `android:prebuild`.
- **Build worked in Expo Go but not via `android:run`** — the dev client uses a different bundle; clear Metro cache with `bunx expo start -c`.
