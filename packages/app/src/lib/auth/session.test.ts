import { beforeEach, describe, expect, it } from "bun:test";
import { setConfigMock } from "../../../test/mocks/api-client";
import {
  clearSecureStoreMock,
  secureStoreDeleteMock,
  secureStoreGetMock,
  secureStoreSetMock,
  setSecureStoreItem,
} from "../../../test/mocks/expo-secure-store";
import { AUTH_TOKEN_STORAGE_KEY } from "./auth.constants";
import {
  clearAuthToken,
  loadAuthToken,
  persistAuthToken,
  setClientAuth,
} from "./session";

describe("auth session", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    setConfigMock.mockClear();
    secureStoreGetMock.mockClear();
    secureStoreSetMock.mockClear();
    secureStoreDeleteMock.mockClear();
  });

  it("persists and loads the auth token", async () => {
    await persistAuthToken("jwt-123");

    expect(secureStoreSetMock).toHaveBeenCalledWith(
      AUTH_TOKEN_STORAGE_KEY,
      "jwt-123",
    );
    await expect(loadAuthToken()).resolves.toBe("jwt-123");
  });

  it("clears the stored auth token", async () => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "jwt-123");

    await clearAuthToken();

    expect(secureStoreDeleteMock).toHaveBeenCalledWith(AUTH_TOKEN_STORAGE_KEY);
    await expect(loadAuthToken()).resolves.toBeNull();
  });

  it("updates the API client auth header", () => {
    setClientAuth("jwt-456");

    expect(setConfigMock).toHaveBeenCalledWith({ auth: "jwt-456" });

    setClientAuth(undefined);

    expect(setConfigMock).toHaveBeenCalledWith({ auth: undefined });
  });
});
