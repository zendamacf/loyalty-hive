import { mock } from "bun:test";

export const initUmamiMock = mock(() => Promise.resolve());
export const isInitializedMock = mock(() => false);
export const trackEventMock = mock(() => Promise.resolve());

mock.module("@bitte-kaufen/expo-umami", () => ({
  initUmami: initUmamiMock,
  isInitialized: isInitializedMock,
  trackScreenView: mock(() => Promise.resolve()),
  trackEvent: trackEventMock,
}));
