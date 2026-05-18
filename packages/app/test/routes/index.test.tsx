import { beforeEach, describe, expect, it, type mock } from "bun:test";

import { waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import {
  clearSecureStoreMock,
  setSecureStoreItem,
} from "../mocks/expo-secure-store";
import { renderWithProviders } from "../render";

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    replace: ReturnType<typeof mock>;
  };
};

const Index = (await import("../../app/index")).default;

describe("app index", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    __expoRouterMocks.replace.mockClear();
  });

  it("redirects to cards when a stored auth token exists", async () => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");

    await renderWithProviders(<Index />);

    await waitFor(() => {
      expect(__expoRouterMocks.replace).toHaveBeenCalledWith(Routes.CARDS);
    });
  });
});
