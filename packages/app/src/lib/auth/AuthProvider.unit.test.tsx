import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { Routes } from "@/constants/routes.constants";
import { getBearerToken, setBearerToken } from "@/lib/api-client/setup";
import { queryClient } from "@/lib/query-client";
import { getExpoRouterMocks } from "../../../test/mocks/expo-router";
import {
  clearSecureStoreMock,
  secureStoreSetMock,
  setSecureStoreItem,
} from "../../../test/mocks/expo-secure-store";
import {
  clearUnauthorizedHandlerMock,
  getUnauthorizedHandler,
  installUnauthorizedInterceptorMock,
  setUnauthorizedHandlerMock,
} from "../../../test/mocks/unauthorized";
import { AUTH_TOKEN_STORAGE_KEY } from "./auth.constants";

mock.module("@/lib/api-client/unauthorized", () => ({
  installUnauthorizedInterceptor: installUnauthorizedInterceptorMock,
  setUnauthorizedHandler: setUnauthorizedHandlerMock,
}));

const { AuthProvider, useAuth } = await import("./AuthProvider");

const expoRouterMocks = getExpoRouterMocks();

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("[Unit] AuthProvider", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    setBearerToken(undefined);
    clearUnauthorizedHandlerMock();
    setUnauthorizedHandlerMock.mockClear();
    expoRouterMocks.replace.mockClear();
    queryClient.clear();
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within AuthProvider",
    );
  });

  it("restores an existing session from secure storage", async () => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-jwt");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(getBearerToken()).toBe("stored-jwt");
  });

  it("starts unauthenticated when no token is stored", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(getBearerToken()).toBeUndefined();
  });

  it("signIn persists the token and marks the user authenticated", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.signIn("fresh-jwt");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(getBearerToken()).toBe("fresh-jwt");
    expect(secureStoreSetMock).toHaveBeenCalledWith(
      AUTH_TOKEN_STORAGE_KEY,
      "fresh-jwt",
    );
  });

  it("signOut clears the session and query cache", async () => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-jwt");
    queryClient.setQueryData(["cards"], [{ id: "1" }]);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(getBearerToken()).toBeUndefined();
    expect(queryClient.getQueryData(["cards"])).toBeUndefined();
  });

  it("registers an unauthorized handler that signs out and returns to login", async () => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-jwt");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const unauthorizedHandler = getUnauthorizedHandler();
    if (!unauthorizedHandler) {
      throw new Error("expected unauthorized handler to be registered");
    }

    await act(async () => {
      await unauthorizedHandler();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(getBearerToken()).toBeUndefined();
    expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
  });

  it("clears the unauthorized handler on unmount", async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(setUnauthorizedHandlerMock).toHaveBeenCalled());

    unmount();

    expect(setUnauthorizedHandlerMock).toHaveBeenLastCalledWith(undefined);
  });
});
