import type { mock } from "bun:test";

export type ExpoClipboardMocks = {
  setStringAsync: ReturnType<typeof mock>;
};

export type ReactNativeAlertMocks = {
  alert: ReturnType<typeof mock>;
};

export function getExpoClipboardMocks(): ExpoClipboardMocks {
  return (
    globalThis as typeof globalThis & {
      __expoClipboardMocks: ExpoClipboardMocks;
    }
  ).__expoClipboardMocks;
}

export function getReactNativeAlertMocks(): ReactNativeAlertMocks {
  return (
    globalThis as typeof globalThis & {
      __reactNativeAlertMocks: ReactNativeAlertMocks;
    }
  ).__reactNativeAlertMocks;
}
