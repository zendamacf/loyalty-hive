import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  errorResponse,
  jsonResponse,
  mockFetch,
  restoreFetch,
} from "../test/fetch-mock";
import { ADMIN, brandRequest, brandRequestList } from "../test/fixtures";
import { App } from "./App";

afterEach(() => {
  cleanup();
  restoreFetch();
});

/** A small fake of the admin API with a session flag. */
function mockAdminApi(initiallyLoggedIn: boolean) {
  let loggedIn = initiallyLoggedIn;
  return mockFetch((url, init) => {
    switch (`${init.method ?? "GET"} ${url.pathname}`) {
      case "GET /api/v1/admin/auth/me":
        return loggedIn ? jsonResponse(ADMIN) : errorResponse(401);
      case "POST /api/v1/admin/auth/login":
        loggedIn = true;
        return jsonResponse(ADMIN);
      case "POST /api/v1/admin/auth/logout":
        loggedIn = false;
        return new Response(null, { status: 204 });
      case "GET /api/v1/admin/brand-requests":
        return loggedIn
          ? jsonResponse(brandRequestList([brandRequest()]))
          : errorResponse(401);
      default:
        return errorResponse(404);
    }
  });
}

describe("[Integration] App", () => {
  it("shows the login form when there is no session", async () => {
    mockAdminApi(false);
    render(<App />);

    expect(await screen.findByRole("button", { name: "Log in" })).toBeDefined();
  });

  it("logs in, shows brand requests, and logs out", async () => {
    mockAdminApi(false);
    render(<App />);

    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: ADMIN.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Coffee Club")).toBeDefined();
    expect(screen.getByText(ADMIN.email)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("button", { name: "Log in" })).toBeDefined();
  });

  it("opens the list directly when a session exists", async () => {
    mockAdminApi(true);
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Brand requests" }),
    ).toBeDefined();
    expect(await screen.findByText("Coffee Club")).toBeDefined();
  });

  it("goes back to login when the session ends during use", async () => {
    let meCalls = 0;
    mockFetch((url) => {
      if (url.pathname.endsWith("/auth/me")) {
        meCalls += 1;
        return jsonResponse(ADMIN);
      }
      return errorResponse(401);
    });
    render(<App />);

    expect(await screen.findByRole("button", { name: "Log in" })).toBeDefined();
    expect(meCalls).toBe(1);
  });

  it("stays logged in and shows an error when logout fails", async () => {
    mockFetch((url, init) => {
      if (url.pathname.endsWith("/auth/me")) return jsonResponse(ADMIN);
      if (init.method === "POST") throw new TypeError("Failed to fetch");
      return jsonResponse(brandRequestList([]));
    });
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Log out" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not log out. Try again.",
    );
    expect(screen.getByRole("button", { name: "Log out" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Log in" })).toBeNull();
  });
});
