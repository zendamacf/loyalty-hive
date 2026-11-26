import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { PENDING_SHARE_TOKEN_KEY } from "@/lib/pending-share/pending-share";
import {
  getApiV1AuthMeMock,
  postApiV1SharesAcceptMock,
  postApiV1SharesPreviewMock,
} from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import {
  secureStoreGetMock,
  setSecureStoreItem,
} from "../../test/mocks/expo-secure-store";
import { press, renderWithProviders } from "../../test/render";
import { AcceptShareScreen } from "./AcceptShareScreen";

const expoRouterMocks = getExpoRouterMocks();
const defaults = {
  preview: postApiV1SharesPreviewMock.getMockImplementation(),
  accept: postApiV1SharesAcceptMock.getMockImplementation(),
  me: getApiV1AuthMeMock.getMockImplementation(),
};

function linkError(status: number, error: string) {
  return Promise.resolve({
    data: undefined,
    error: { error },
    response: { status, ok: false },
  });
}

describe("[Integration] AcceptShareScreen", () => {
  beforeEach(() => {
    expoRouterMocks.params = { token: "share-token" };
    expoRouterMocks.replace.mockClear();
    postApiV1SharesPreviewMock.mockClear();
    postApiV1SharesAcceptMock.mockClear();
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
  });

  afterEach(() => {
    if (defaults.preview)
      postApiV1SharesPreviewMock.mockImplementation(defaults.preview);
    if (defaults.accept)
      postApiV1SharesAcceptMock.mockImplementation(defaults.accept);
    if (defaults.me) getApiV1AuthMeMock.mockImplementation(defaults.me);
  });

  it("shows a card invite and accepts it", async () => {
    const { findByText, getByText } = await renderWithProviders(
      <AcceptShareScreen />,
    );

    expect(
      await findByText("owner@example.com wants to share a card with you"),
    ).toBeTruthy();
    expect(postApiV1SharesPreviewMock).toHaveBeenCalledWith(
      expect.objectContaining({ body: { token: "share-token" } }),
    );

    await press(getByText("Add to my wallet"));

    await waitFor(() => {
      expect(postApiV1SharesAcceptMock).toHaveBeenCalledWith(
        expect.objectContaining({ body: { token: "share-token" } }),
      );
      expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("says that an account share includes cards added later", async () => {
    postApiV1SharesPreviewMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          scope: "account",
          ownerEmail: "owner@example.com",
          expiresAt: new Date().toISOString(),
        },
        error: undefined,
      }),
    );

    const { findByText } = await renderWithProviders(<AcceptShareScreen />);

    expect(
      await findByText(
        "owner@example.com wants to share all their cards with you",
      ),
    ).toBeTruthy();
    expect(
      await findByText(
        "You will see every card in their wallet, including cards they add later. You cannot change their cards.",
      ),
    ).toBeTruthy();
  });

  it("shows a clear message for an invite to another account", async () => {
    postApiV1SharesPreviewMock.mockImplementation(() =>
      linkError(403, "This share is for a different account"),
    );
    const { findByText } = await renderWithProviders(<AcceptShareScreen />);
    expect(
      await findByText(
        "This invite is for a different account. Log in with the email that got the invite.",
      ),
    ).toBeTruthy();
  });

  it("shows a clear message for an expired link", async () => {
    postApiV1SharesPreviewMock.mockImplementation(() =>
      linkError(410, "This share link has expired or was cancelled"),
    );
    const { findByText } = await renderWithProviders(<AcceptShareScreen />);
    expect(
      await findByText(
        "This link was already used, has expired, or was cancelled.",
      ),
    ).toBeTruthy();
  });

  it("shows the expired message when the link was used before accept", async () => {
    postApiV1SharesAcceptMock.mockImplementation(() =>
      linkError(410, "This share link has expired or was cancelled"),
    );
    const { findByText, getByText } = await renderWithProviders(
      <AcceptShareScreen />,
    );

    await findByText("owner@example.com wants to share a card with you");
    await press(getByText("Add to my wallet"));

    expect(
      await findByText(
        "This link was already used, has expired, or was cancelled.",
      ),
    ).toBeTruthy();
    expect(expoRouterMocks.replace).not.toHaveBeenCalledWith(Routes.CARDS);
  });

  it("shows the offline message when there is no network", async () => {
    postApiV1SharesPreviewMock.mockImplementation(() =>
      Promise.reject(new TypeError("Network request failed")),
    );
    const { findByText } = await renderWithProviders(<AcceptShareScreen />);

    expect(
      await findByText(
        "You're offline. Connect to the internet to make changes.",
      ),
    ).toBeTruthy();
  });

  it("keeps the token and goes to sign-in when the user is not verified", async () => {
    getApiV1AuthMeMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "test@example.com",
          emailVerified: false,
        },
        error: undefined,
      }),
    );

    await renderWithProviders(<AcceptShareScreen />);

    await waitFor(() => {
      expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
    });
    expect(await secureStoreGetMock(PENDING_SHARE_TOKEN_KEY)).toBe(
      "share-token",
    );
    expect(postApiV1SharesPreviewMock).not.toHaveBeenCalled();
  });
});
