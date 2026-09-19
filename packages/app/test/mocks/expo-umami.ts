import { mock } from "bun:test";

export const initUmamiMock = mock(() => Promise.resolve());

mock.module("@bitte-kaufen/expo-umami", () => ({
  initUmami: initUmamiMock,
  isInitialized: () => false,
  trackScreenView: mock(() => Promise.resolve()),
  trackEvent: mock(() => Promise.resolve()),
}));
