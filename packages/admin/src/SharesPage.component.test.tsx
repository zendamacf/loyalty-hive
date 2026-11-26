import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { jsonResponse, mockFetch, restoreFetch } from "../test/fetch-mock";
import { adminShare, shareList } from "../test/fixtures";
import { SharesPage } from "./SharesPage";
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

describe("[Component] SharesPage", () => {
  it("shows each share with its type, and no card details", async () => {
    mockFetch(() =>
      jsonResponse(
        shareList([
          adminShare(),
          adminShare({
            id: "share-2",
            scope: "account",
            recipientEmail: "family@example.com",
          }),
        ]),
      ),
    );
    render(<SharesPage onUnauthorized={mock()} />);

    const row = (await screen.findByText("family@example.com")).closest("tr");
    if (!row) throw new Error("Row not found");
    expect(within(row).getByText("owner@example.com")).toBeDefined();
    expect(within(row).getByText("Account")).toBeDefined();
    const cardRow = screen.getByText("friend@example.com").closest("tr");
    if (!cardRow) throw new Error("Row not found");
    expect(within(cardRow).getByText("Individual")).toBeDefined();
  });

  it("filters by type", async () => {
    const fetch = mockFetch(() => jsonResponse(shareList([adminShare()])));
    render(<SharesPage onUnauthorized={mock()} />);
    await screen.findByText("friend@example.com");

    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "account" },
    });

    await waitFor(() => {
      expect(requestedQueries(fetch)).toEqual([
        { limit: String(PAGE_SIZE), offset: "0" },
        { limit: String(PAGE_SIZE), offset: "0", scope: "account" },
      ]);
    });
  });

  it("shows an empty message", async () => {
    mockFetch(() => jsonResponse(shareList([])));
    render(<SharesPage onUnauthorized={mock()} />);

    expect(await screen.findByText("No shares.")).toBeDefined();
  });
});
