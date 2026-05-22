import { beforeEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, waitFor } from "@testing-library/react-native";
import { Pressable, TouchableOpacity } from "react-native";

import { APP_NAME } from "@/constants/branding.constants";
import { Routes } from "@/constants/routes.constants";
import type {
  PostApiV1AuthLoginResponse,
  PostApiV1AuthSignupResponse,
} from "@/lib/api-client";
import { getBearerToken, setBearerToken } from "@/lib/api-client/setup";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import {
  postApiV1AuthLoginMock,
  postApiV1AuthSignupMock,
} from "../../test/mocks/api-client";
import {
  clearSecureStoreMock,
  secureStoreSetMock,
} from "../../test/mocks/expo-secure-store";
import { renderWithTheme } from "../../test/render";

/** Bun otherwise executes the real PNG file when LoginScreen loads `require(...)`. */
mock.module("../../assets/icon.png", () => ({ default: 1 }));

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    replace: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

const { LoginScreen } = await import("./LoginScreen");

describe("LoginScreen", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    setBearerToken(undefined);
    __expoRouterMocks.replace.mockClear();
    secureStoreSetMock.mockClear();
    postApiV1AuthLoginMock.mockClear();
    postApiV1AuthSignupMock.mockClear();
    postApiV1AuthLoginMock.mockImplementation(() =>
      Promise.resolve({ data: { token: "test-token" }, error: undefined }),
    );
    postApiV1AuthSignupMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          id: "00000000-0000-4000-8000-000000000099",
          email: "test@example.com",
        },
        error: undefined,
      }),
    );
  });

  it("renders login fields and copy by default", async () => {
    const { getByText, getByPlaceholderText, getByLabelText } =
      await renderWithTheme(<LoginScreen />);

    expect(getByLabelText("Use dark theme")).toBeTruthy();
    expect(getByText("sun")).toBeTruthy();
    expect(getByText(APP_NAME)).toBeTruthy();
    expect(getByText("Sign in to manage your loyalty cards")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByLabelText("Show password")).toBeTruthy();
    expect(getByText("eye")).toBeTruthy();
    expect(getByText("Sign in")).toBeTruthy();
  });

  it("toggles password visibility", async () => {
    const { getByPlaceholderText, getByLabelText, getByText } =
      await renderWithTheme(<LoginScreen />);

    const passwordInput = getByPlaceholderText("Password");

    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText("Show password"));

    expect(passwordInput.props.secureTextEntry).toBe(false);
    expect(getByLabelText("Hide password")).toBeTruthy();
    expect(getByText("eye-off")).toBeTruthy();

    fireEvent.press(getByLabelText("Hide password"));

    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(getByLabelText("Show password")).toBeTruthy();
  });

  it("toggles theme from the header control", async () => {
    const { getByLabelText, getByText } = await renderWithTheme(
      <LoginScreen />,
    );

    expect(getByLabelText("Use dark theme")).toBeTruthy();
    expect(getByText("sun")).toBeTruthy();

    fireEvent.press(getByLabelText("Use dark theme"));

    await waitFor(() => {
      expect(getByLabelText("Use light theme")).toBeTruthy();
      expect(getByText("moon")).toBeTruthy();
    });
  });

  it("shows validation when email or password is missing", async () => {
    const { getByText } = await renderWithTheme(<LoginScreen />);

    fireEvent.press(getByText("Sign in"));

    expect(getByText("Enter your email and password.")).toBeTruthy();
  });

  it("toggles between login and signup copy", async () => {
    const { getByText, queryByText } = await renderWithTheme(<LoginScreen />);

    fireEvent.press(getByText("Need an account? Sign up"));

    expect(getByText("Create an account to get started")).toBeTruthy();
    expect(getByText("Create account")).toBeTruthy();

    fireEvent.press(getByText("Already have an account? Sign in"));

    expect(getByText("Sign in to manage your loyalty cards")).toBeTruthy();
    expect(queryByText("Create account")).toBeNull();
  });

  it("clears error when switching auth mode", async () => {
    const { getByText } = await renderWithTheme(<LoginScreen />);

    fireEvent.press(getByText("Sign in"));
    expect(getByText("Enter your email and password.")).toBeTruthy();

    fireEvent.press(getByText("Need an account? Sign up"));

    expect(() => getByText("Enter your email and password.")).toThrow();
  });

  it("trims email, sets auth token, and replaces route on successful login", async () => {
    const { getByText, getByPlaceholderText } = await renderWithTheme(
      <LoginScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "  hi@example.com ");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(postApiV1AuthLoginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { email: "hi@example.com", password: "secret" },
        }),
      );
      expect(getBearerToken()).toBe("test-token");
      expect(secureStoreSetMock).toHaveBeenCalledWith(
        AUTH_TOKEN_STORAGE_KEY,
        "test-token",
      );
      expect(__expoRouterMocks.replace).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("shows validation when pressing Enter on the password field with empty fields", async () => {
    const { getByPlaceholderText, getByText } = await renderWithTheme(
      <LoginScreen />,
    );

    fireEvent(getByPlaceholderText("Password"), "submitEditing");

    expect(getByText("Enter your email and password.")).toBeTruthy();
  });

  it("submits login when pressing Enter on the password field", async () => {
    const { getByPlaceholderText } = await renderWithTheme(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "hi@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent(getByPlaceholderText("Password"), "submitEditing");

    await waitFor(() => {
      expect(postApiV1AuthLoginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { email: "hi@example.com", password: "secret" },
        }),
      );
      expect(getBearerToken()).toBe("test-token");
      expect(__expoRouterMocks.replace).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("does not submit login when pressing Enter on the email field (only focuses password)", async () => {
    const { getByPlaceholderText } = await renderWithTheme(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "hi@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent(getByPlaceholderText("Email"), "submitEditing");

    expect(postApiV1AuthLoginMock).not.toHaveBeenCalled();
  });

  it("signs up then logs in when pressing Enter on the password field in signup mode", async () => {
    const { getByText, getByPlaceholderText } = await renderWithTheme(
      <LoginScreen />,
    );

    fireEvent.press(getByText("Need an account? Sign up"));
    fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "pw");
    fireEvent(getByPlaceholderText("Password"), "submitEditing");

    await waitFor(() => {
      expect(postApiV1AuthSignupMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { email: "new@example.com", password: "pw" },
        }),
      );
      expect(postApiV1AuthLoginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { email: "new@example.com", password: "pw" },
        }),
      );
      expect(getBearerToken()).toBe("test-token");
      expect(__expoRouterMocks.replace).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("shows API error message from login", async () => {
    postApiV1AuthLoginMock.mockImplementation(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Invalid email or password" },
      }),
    );

    const { getByText, getByPlaceholderText } = await renderWithTheme(
      <LoginScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "a@b.co");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrong");
    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(getByText("Invalid email or password")).toBeTruthy();
    });
  });

  it("shows fallback when login returns no token", async () => {
    postApiV1AuthLoginMock.mockImplementation(() =>
      Promise.resolve({
        data: {} as PostApiV1AuthLoginResponse,
        error: undefined,
      }),
    );

    const { getByText, getByPlaceholderText } = await renderWithTheme(
      <LoginScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "a@b.co");
    fireEvent.changeText(getByPlaceholderText("Password"), "ok");
    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(getByText("Unexpected response from server.")).toBeTruthy();
    });
    expect(__expoRouterMocks.replace).not.toHaveBeenCalled();
  });

  it("shows API error message from signup", async () => {
    postApiV1AuthSignupMock.mockImplementation(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Email already registered" },
      }),
    );

    const { getByText, getByPlaceholderText } = await renderWithTheme(
      <LoginScreen />,
    );

    fireEvent.press(getByText("Need an account? Sign up"));
    fireEvent.changeText(getByPlaceholderText("Email"), "taken@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "pw");
    fireEvent.press(getByText("Create account"));

    await waitFor(() => {
      expect(getByText("Email already registered")).toBeTruthy();
    });
    expect(__expoRouterMocks.replace).not.toHaveBeenCalled();
  });

  it("shows fallback when signup returns no id", async () => {
    postApiV1AuthSignupMock.mockImplementation(() =>
      Promise.resolve({
        data: {} as PostApiV1AuthSignupResponse,
        error: undefined,
      }),
    );

    const { getByText, getByPlaceholderText } = await renderWithTheme(
      <LoginScreen />,
    );

    fireEvent.press(getByText("Need an account? Sign up"));
    fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "pw");
    fireEvent.press(getByText("Create account"));

    await waitFor(() => {
      expect(getByText("Unexpected response from server.")).toBeTruthy();
    });
    expect(postApiV1AuthLoginMock).not.toHaveBeenCalled();
    expect(__expoRouterMocks.replace).not.toHaveBeenCalled();
  });

  it("shows submitting state while login is in progress", async () => {
    postApiV1AuthLoginMock.mockImplementation(() => new Promise(() => {}));

    const {
      getByText,
      getByPlaceholderText,
      UNSAFE_getByType,
      UNSAFE_getAllByType,
    } = await renderWithTheme(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "hi@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(getByText("Signing in…")).toBeTruthy();
    });

    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
    expect(
      UNSAFE_getAllByType(Pressable).some((p) => p.props.disabled === true),
    ).toBe(true);
    expect(getByPlaceholderText("Email").props.editable).toBe(false);
  });

  it("shows submitting state while signup is in progress", async () => {
    postApiV1AuthSignupMock.mockImplementation(() => new Promise(() => {}));

    const {
      getByText,
      getByPlaceholderText,
      UNSAFE_getByType,
      UNSAFE_getAllByType,
    } = await renderWithTheme(<LoginScreen />);

    fireEvent.press(getByText("Need an account? Sign up"));
    fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "pw");
    fireEvent.press(getByText("Create account"));

    await waitFor(() => {
      expect(getByText("Creating account…")).toBeTruthy();
    });

    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
    expect(
      UNSAFE_getAllByType(Pressable).some((p) => p.props.disabled === true),
    ).toBe(true);
    expect(getByPlaceholderText("Email").props.editable).toBe(false);
  });

  it("signs up then logs in on successful signup", async () => {
    const { getByText, getByPlaceholderText } = await renderWithTheme(
      <LoginScreen />,
    );

    fireEvent.press(getByText("Need an account? Sign up"));
    fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "pw");
    fireEvent.press(getByText("Create account"));

    await waitFor(() => {
      expect(postApiV1AuthSignupMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { email: "new@example.com", password: "pw" },
        }),
      );
      expect(postApiV1AuthLoginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { email: "new@example.com", password: "pw" },
        }),
      );
      expect(getBearerToken()).toBe("test-token");
      expect(__expoRouterMocks.replace).toHaveBeenCalledWith(Routes.CARDS);
    });
  });
});
