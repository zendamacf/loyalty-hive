import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  errorResponse,
  jsonResponse,
  mockFetch,
  restoreFetch,
} from "../test/fetch-mock";
import { ADMIN } from "../test/fixtures";
import { LoginPage } from "./LoginPage";

afterEach(() => {
  cleanup();
  restoreFetch();
});

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "admin@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
}

describe("[Component] LoginPage", () => {
  it("calls onLogin with the admin after a successful login", async () => {
    const fetch = mockFetch(() => jsonResponse(ADMIN));
    const onLogin = mock();
    render(<LoginPage onLogin={onLogin} />);

    fillAndSubmit();

    await screen.findByRole("button", { name: "Logging in…" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onLogin).toHaveBeenCalledWith(ADMIN);
    const [, init] = fetch.mock.calls[0] ?? [];
    expect(JSON.parse(String(init?.body))).toEqual({
      email: "admin@example.com",
      password: "Password123456",
    });
  });

  for (const [status, message] of [
    [401, "Invalid email or password."],
    [429, "Too many login attempts. Wait a minute, then try again."],
    [503, "Admin login is not configured."],
    [500, "Login failed. Try again."],
  ] as const) {
    it(`shows an error for HTTP ${status}`, async () => {
      mockFetch(() => errorResponse(status));
      const onLogin = mock();
      render(<LoginPage onLogin={onLogin} />);

      fillAndSubmit();

      expect((await screen.findByRole("alert")).textContent).toBe(message);
      expect(onLogin).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Log in" }).hasAttribute("disabled"),
      ).toBe(false);
    });
  }

  it("shows a general error when the network fails", async () => {
    mockFetch(() => {
      throw new TypeError("Failed to fetch");
    });
    render(<LoginPage onLogin={mock()} />);

    fillAndSubmit();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Login failed. Try again.",
    );
  });
});
