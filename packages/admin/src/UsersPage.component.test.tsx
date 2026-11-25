import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import {
  errorResponse,
  jsonResponse,
  mockFetch,
  restoreFetch,
} from "../test/fetch-mock";
import { adminUser, userList } from "../test/fixtures";
import { SEARCH_DEBOUNCE_MS, UsersPage } from "./UsersPage";
import { PAGE_SIZE } from "./usePagedList";

afterEach(() => {
  cleanup();
  restoreFetch();
});

function requestedQueries(fetch: ReturnType<typeof mockFetch>) {
  return fetch.mock.calls.map(([input]) =>
    Object.fromEntries(new URL(String(input), "http://localhost").searchParams),
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("[Component] UsersPage", () => {
  it("loads all users and shows each row", async () => {
    const fetch = mockFetch(() =>
      jsonResponse(
        userList([
          adminUser(),
          adminUser({
            id: "user-2",
            email: "gone@example.com",
            emailVerifiedAt: null,
            deletedAt: "2026-11-21T10:00:00.000Z",
          }),
        ]),
      ),
    );
    render(<UsersPage onUnauthorized={mock()} />);

    const active = (await screen.findByText("user@example.com")).closest("tr");
    const deleted = screen.getByText("gone@example.com").closest("tr");
    if (!active || !deleted) throw new Error("Rows not found");

    expect(within(active).getByText("Yes")).toBeDefined();
    expect(within(active).getByText("active")).toBeDefined();
    expect(within(deleted).getByText("No")).toBeDefined();
    const badge = within(deleted).getByText("pending deletion");
    expect(badge.getAttribute("title")).toStartWith("Deleted at ");
    expect(screen.getByText("1–2 of 2")).toBeDefined();

    expect(requestedQueries(fetch)).toEqual([
      { limit: String(PAGE_SIZE), offset: "0" },
    ]);
  });

  it("searches after the user stops typing", async () => {
    const fetch = mockFetch(() => jsonResponse(userList([adminUser()])));
    render(<UsersPage onUnauthorized={mock()} />);
    await screen.findByText("user@example.com");

    const input = screen.getByLabelText("Search email");
    fireEvent.change(input, { target: { value: "us" } });
    fireEvent.change(input, { target: { value: " user@ " } });
    await sleep(SEARCH_DEBOUNCE_MS / 2);
    expect(fetch).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2), {
      timeout: SEARCH_DEBOUNCE_MS * 3,
    });
    expect(requestedQueries(fetch)[1]).toEqual({
      limit: "50",
      offset: "0",
      search: "user@",
    });
  });

  it("sends the status and verified filters, and goes back to page 1", async () => {
    const fetch = mockFetch((url) =>
      jsonResponse(
        userList([adminUser()], {
          total: 120,
          offset: Number(url.searchParams.get("offset")),
        }),
      ),
    );
    render(<UsersPage onUnauthorized={mock()} />);
    await screen.findByText("1–50 of 120");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("51–100 of 120");

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "pending_deletion" },
    });
    await screen.findByText("1–50 of 120");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "false" },
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "true" },
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(5));

    expect(requestedQueries(fetch)).toEqual([
      { limit: "50", offset: "0" },
      { limit: "50", offset: "50" },
      { limit: "50", offset: "0", status: "pending_deletion" },
      {
        limit: "50",
        offset: "0",
        status: "pending_deletion",
        verified: "false",
      },
      {
        limit: "50",
        offset: "0",
        status: "pending_deletion",
        verified: "true",
      },
    ]);
  });

  it("shows an empty state", async () => {
    mockFetch(() => jsonResponse(userList([])));
    render(<UsersPage onUnauthorized={mock()} />);
    expect(await screen.findByText("No users.")).toBeDefined();
  });

  it("calls onUnauthorized on 401", async () => {
    mockFetch(() => errorResponse(401));
    const onUnauthorized = mock();
    render(<UsersPage onUnauthorized={onUnauthorized} />);
    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it("shows an error when the list cannot load", async () => {
    mockFetch(() => errorResponse(500));
    render(<UsersPage onUnauthorized={mock()} />);
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not load users.",
    );
  });
});
