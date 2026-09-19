import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import "@/i18n";

mock.module("expo-linking", () => ({
  openURL: mock(() => Promise.resolve()),
}));

type MetaAppVersionResult =
  | {
      data: {
        platform: "android" | "ios";
        minimumVersion: string;
      };
      error?: undefined;
    }
  | {
      data?: undefined;
      error: { error: string };
    };

const getApiV1MetaAppVersionMock = mock(
  (): Promise<MetaAppVersionResult> =>
    Promise.resolve({
      data: {
        platform: "ios",
        minimumVersion: "99.0.0",
      },
      error: undefined,
    }),
);

mock.module("@/lib/api-client", () => ({
  getApiV1MetaAppVersion: getApiV1MetaAppVersionMock,
}));

const { VersionCheckProvider } = await import("./VersionCheckProvider");

describe("[Unit] VersionCheckProvider", () => {
  beforeEach(() => {
    getApiV1MetaAppVersionMock.mockClear();
    getApiV1MetaAppVersionMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          platform: "ios",
          minimumVersion: "99.0.0",
        },
        error: undefined,
      }),
    );
    process.env.EXPO_PUBLIC_SKIP_VERSION_CHECK = "";
  });

  it("renders children when the app version satisfies the minimum", async () => {
    getApiV1MetaAppVersionMock.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          platform: "ios",
          minimumVersion: "0.0.1",
        },
        error: undefined,
      }),
    );

    const screen = await render(
      <VersionCheckProvider>
        <Text>App content</Text>
      </VersionCheckProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("App content")).toBeTruthy();
    });
  });

  it("blocks the app when the current version is below the minimum", async () => {
    const screen = await render(
      <VersionCheckProvider>
        <Text>App content</Text>
      </VersionCheckProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Update required")).toBeTruthy();
    });

    expect(screen.queryByText("App content")).toBeNull();
  });

  it("fails open when the version check request fails", async () => {
    getApiV1MetaAppVersionMock.mockImplementationOnce(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Service unavailable" },
      }),
    );

    const screen = await render(
      <VersionCheckProvider>
        <Text>App content</Text>
      </VersionCheckProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("App content")).toBeTruthy();
    });
  });

  it("skips the version check when EXPO_PUBLIC_SKIP_VERSION_CHECK is true", async () => {
    process.env.EXPO_PUBLIC_SKIP_VERSION_CHECK = "true";

    const screen = await render(
      <VersionCheckProvider>
        <Text>App content</Text>
      </VersionCheckProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("App content")).toBeTruthy();
    });

    expect(getApiV1MetaAppVersionMock).not.toHaveBeenCalled();
  });
});
