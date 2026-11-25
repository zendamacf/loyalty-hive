import { afterEach, describe, expect, it } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import {
  errorResponse,
  jsonResponse,
  mockFetch,
  restoreFetch,
} from "../test/fetch-mock";
import {
  ADMIN,
  adminUser,
  brandRequest,
  brandRequestList,
  userList,
} from "../test/fixtures";
import { App } from "./App";

afterEach(() => {
  cleanup();
  restoreFetch();
  window.history.replaceState(null, "", "/admin/");
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
      case "GET /api/v1/admin/users":
        return loggedIn
          ? jsonResponse(userList([adminUser()]))
          : errorResponse(401);
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

  it("logs in, shows users, and logs out", async () => {
    mockAdminApi(false);
    render(<App />);

    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: ADMIN.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("user@example.com")).toBeDefined();
    expect(screen.getByText(ADMIN.email)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("button", { name: "Log in" })).toBeDefined();
  });

  it("opens the users page directly when a session exists", async () => {
    mockAdminApi(true);
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Users" })).toBeDefined();
    expect(await screen.findByText("user@example.com")).toBeDefined();
  });

  it("shows Users first in the main navigation", async () => {
    mockAdminApi(true);
    render(<App />);

    const nav = await screen.findByRole("navigation", { name: "Main" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Users", "Brand requests"]);
  });

  it("moves between pages with the main navigation", async () => {
    mockAdminApi(true);
    render(<App />);
    expect(await screen.findByText("user@example.com")).toBeDefined();

    const nav = screen.getByRole("navigation", { name: "Main" });
    const brandLink = within(nav).getByRole("link", { name: "Brand requests" });
    expect(brandLink.getAttribute("href")).toBe("/admin/brand-requests");

    fireEvent.click(brandLink);
    expect(
      await screen.findByRole("heading", { name: "Brand requests" }),
    ).toBeDefined();
    expect(await screen.findByText("Coffee Club")).toBeDefined();
    expect(window.location.pathname).toBe("/admin/brand-requests");
    expect(brandLink.getAttribute("aria-current")).toBe("page");

    fireEvent.click(within(nav).getByRole("link", { name: "Users" }));
    expect(await screen.findByRole("heading", { name: "Users" })).toBeDefined();
  });

  it("opens the brand requests page from a deep link", async () => {
    window.history.replaceState(null, "", "/admin/brand-requests");
    mockAdminApi(true);
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Brand requests" }),
    ).toBeDefined();
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
