import { beforeEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, waitFor } from "@testing-library/react-native";

/** Bun otherwise executes the real PNG file when LoginScreen loads `require(...)`. */
mock.module("../../assets/images/icon.png", () => ({ default: 1 }));

const setConfigMock = mock(() => {});

const postApiV1AuthLoginMock = mock(() =>
  Promise.resolve({ data: { token: "test-token" }, error: undefined }),
);

const postApiV1AuthSignupMock = mock(() =>
  Promise.resolve({
    data: { id: "00000000-0000-4000-8000-000000000099" },
    error: undefined,
  }),
);

mock.module("@/lib/api-client", () => ({
  client: {
    setConfig: setConfigMock,
  },
  postApiV1AuthLogin: postApiV1AuthLoginMock,
  postApiV1AuthSignup: postApiV1AuthSignupMock,
}));

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    replace: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

const { LoginScreen } = await import("./LoginScreen");

describe("LoginScreen", () => {
  beforeEach(() => {
    __expoRouterMocks.replace.mockClear();
    setConfigMock.mockClear();
    postApiV1AuthLoginMock.mockClear();
    postApiV1AuthSignupMock.mockClear();
    postApiV1AuthLoginMock.mockImplementation(() =>
      Promise.resolve({ data: { token: "test-token" }, error: undefined }),
    );
    postApiV1AuthSignupMock.mockImplementation(() =>
      Promise.resolve({
        data: { id: "00000000-0000-4000-8000-000000000099" },
        error: undefined,
      }),
    );
  });

  it("renders login fields and copy by default", () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    expect(getByText("Loyalty Hive")).toBeTruthy();
    expect(getByText("Sign in to manage your loyalty cards")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Sign in")).toBeTruthy();
  });

  it("shows validation when email or password is missing", () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Sign in"));

    expect(getByText("Enter your email and password.")).toBeTruthy();
  });

  it("toggles between login and signup copy", () => {
    const { getByText, queryByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Need an account? Sign up"));

    expect(getByText("Create an account to get started")).toBeTruthy();
    expect(getByText("Create account")).toBeTruthy();

    fireEvent.press(getByText("Already have an account? Sign in"));

    expect(getByText("Sign in to manage your loyalty cards")).toBeTruthy();
    expect(queryByText("Create account")).toBeNull();
  });

  it("clears error when switching auth mode", () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Sign in"));
    expect(getByText("Enter your email and password.")).toBeTruthy();

    fireEvent.press(getByText("Need an account? Sign up"));

    expect(() => getByText("Enter your email and password.")).toThrow();
  });

  it("trims email, sets auth token, and replaces route on successful login", async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "  hi@example.com ");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(postApiV1AuthLoginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { email: "hi@example.com", password: "secret" },
        }),
      );
      expect(setConfigMock).toHaveBeenCalledWith({ auth: "test-token" });
      expect(__expoRouterMocks.replace).toHaveBeenCalledWith("/home");
    });
  });

  it("shows API error message from login", async () => {
    postApiV1AuthLoginMock.mockImplementation(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Invalid email or password" },
      }),
    );

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "a@b.co");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrong");
    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(getByText("Invalid email or password")).toBeTruthy();
    });
  });

  it("shows fallback when login returns no token", async () => {
    postApiV1AuthLoginMock.mockImplementation(() =>
      Promise.resolve({ data: {}, error: undefined }),
    );

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Email"), "a@b.co");
    fireEvent.changeText(getByPlaceholderText("Password"), "ok");
    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(getByText("Unexpected response from server.")).toBeTruthy();
    });
    expect(__expoRouterMocks.replace).not.toHaveBeenCalled();
  });

  it("signs up then logs in on successful signup", async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

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
      expect(setConfigMock).toHaveBeenCalledWith({ auth: "test-token" });
      expect(__expoRouterMocks.replace).toHaveBeenCalledWith("/home");
    });
  });
});
