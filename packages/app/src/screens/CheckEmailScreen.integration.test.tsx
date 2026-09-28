import { beforeEach, describe, expect, it } from "bun:test";
import { waitFor } from "@testing-library/react-native";

import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import {
  getApiV1AuthMeMock,
  postApiV1AuthResendVerificationMock,
} from "../../test/mocks/api-client";
import { setSecureStoreItem } from "../../test/mocks/expo-secure-store";
import { press, renderWithProviders } from "../../test/render";
import { CheckEmailScreen } from "./CheckEmailScreen";

describe("[Integration] CheckEmailScreen", () => {
  beforeEach(() => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
    postApiV1AuthResendVerificationMock.mockClear();
    getApiV1AuthMeMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "user@example.com",
          emailVerified: false,
        },
        error: undefined,
      }),
    );
  });

  it("shows check-email copy and resends verification", async () => {
    const { getByText } = await renderWithProviders(<CheckEmailScreen />);

    await waitFor(() => {
      expect(getByText("Check your email")).toBeTruthy();
      expect(getByText(/user@example.com/)).toBeTruthy();
    });

    await press(getByText("Resend email"));

    await waitFor(() => {
      expect(postApiV1AuthResendVerificationMock).toHaveBeenCalled();
    });
  });
});
