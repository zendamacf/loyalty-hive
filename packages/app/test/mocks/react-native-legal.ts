import { mock } from "bun:test";

export const launchLicenseListScreenMock = mock((_title?: string) => {});

mock.module("react-native-legal", () => ({
  ReactNativeLegal: {
    launchLicenseListScreen: launchLicenseListScreenMock,
    getLibrariesAsync: mock(() => Promise.resolve({ data: [] })),
  },
}));
