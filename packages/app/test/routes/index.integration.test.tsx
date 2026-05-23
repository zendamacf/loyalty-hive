import { beforeEach, describe, expect, it } from "bun:test";

import { waitFor } from "@testing-library/react-native";

import { APP_NAME } from "@/constants/branding.constants";
import { Routes } from "@/constants/routes.constants";
import i18n from "@/i18n";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { getExpoRouterMocks } from "../mocks/expo-router";
import {
  clearSecureStoreMock,
  setSecureStoreItem,
} from "../mocks/expo-secure-store";
import { renderWithProviders } from "../render";

const expoRouterMocks = getExpoRouterMocks();

const Index = (await import("../../app/index")).default;

describe("[Integration] app index", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    expoRouterMocks.replace.mockClear();
  });

  it("redirects to cards when a stored auth token exists", async () => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");

    await renderWithProviders(<Index />);

    await waitFor(() => {
      expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("renders login when no auth token is stored", async () => {
    const { getByText } = await renderWithProviders(<Index />);

    await waitFor(() => {
      expect(getByText(APP_NAME)).toBeTruthy();
      expect(getByText(i18n.t("signIn", { ns: I18nNamespace.Auth }))).toBeTruthy();
    });
    expect(expoRouterMocks.replace).not.toHaveBeenCalledWith(Routes.CARDS);
  });
});
