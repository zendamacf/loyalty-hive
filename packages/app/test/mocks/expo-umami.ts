import { mock } from "bun:test";

export const initUmamiMock = mock(() => Promise.resolve());
export const identifyUserMock = mock(() => Promise.resolve());
export const clearUserMock = mock(() => {});

mock.module("@bitte-kaufen/expo-umami", () => ({
  initUmami: initUmamiMock,
  isInitialized: () => false,
  trackScreenView: mock(() => Promise.resolve()),
  trackEvent: mock(() => Promise.resolve()),
  identifyUser: identifyUserMock,
  clearUser: clearUserMock,
}));
