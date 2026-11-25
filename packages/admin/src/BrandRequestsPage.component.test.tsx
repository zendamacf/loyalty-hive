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
import { brandRequest, brandRequestList } from "../test/fixtures";
import { BrandRequestsPage } from "./BrandRequestsPage";
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

describe("[Component] BrandRequestsPage", () => {
  it("loads pending requests first and shows each row", async () => {
    const fetch = mockFetch(() =>
      jsonResponse(brandRequestList([brandRequest()])),
    );
    render(<BrandRequestsPage onUnauthorized={mock()} />);

    const row = (await screen.findByText("Coffee Club")).closest("tr");
    if (!row) throw new Error("Row not found");
    const cells = within(row);
    expect(
      cells.getByRole("link", { name: "https://coffee.example.com" }),
    ).toBeDefined();
    expect(
      cells
        .getByRole("link", { name: "https://coffee.example.com" })
        .getAttribute("rel"),
    ).toBe("noopener noreferrer");
    expect(cells.getByText("Near my office")).toBeDefined();
    expect(cells.getByText("pending")).toBeDefined();
    expect(cells.getByText("user@example.com")).toBeDefined();
    expect(screen.getByText("1–1 of 1")).toBeDefined();

    expect(requestedQueries(fetch)).toEqual([
      { limit: String(PAGE_SIZE), offset: "0", status: "pending" },
    ]);
  });

  it("shows a URL that is not http(s) as text, not a link", async () => {
    mockFetch(() =>
      jsonResponse(
        brandRequestList([brandRequest({ url: "javascript:alert(1)" })]),
      ),
    );
    render(<BrandRequestsPage onUnauthorized={mock()} />);

    expect(await screen.findByText("javascript:alert(1)")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows a value that is not a URL as text", async () => {
    mockFetch(() =>
      jsonResponse(brandRequestList([brandRequest({ url: "not a url" })])),
    );
    render(<BrandRequestsPage onUnauthorized={mock()} />);

    expect(await screen.findByText("not a url")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows an empty state", async () => {
    mockFetch(() => jsonResponse(brandRequestList([])));
    render(<BrandRequestsPage onUnauthorized={mock()} />);

    expect(await screen.findByText("No brand requests.")).toBeDefined();
    expect(screen.getByText("0–0 of 0")).toBeDefined();
  });

  it("changes the status filter and goes back to the first page", async () => {
    const fetch = mockFetch((url) =>
      jsonResponse(
        brandRequestList([brandRequest()], {
          total: 120,
          offset: Number(url.searchParams.get("offset")),
        }),
      ),
    );
    render(<BrandRequestsPage onUnauthorized={mock()} />);
    await screen.findByText("1–50 of 120");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("51–100 of 120");

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "" },
    });
    await screen.findByText("1–50 of 120");

    expect(requestedQueries(fetch)).toEqual([
      { limit: "50", offset: "0", status: "pending" },
      { limit: "50", offset: "50", status: "pending" },
      { limit: "50", offset: "0" },
    ]);
  });

  it("pages forward and back, and disables buttons at the ends", async () => {
    mockFetch((url) =>
      jsonResponse(
        brandRequestList([brandRequest()], {
          total: 120,
          offset: Number(url.searchParams.get("offset")),
        }),
      ),
    );
    render(<BrandRequestsPage onUnauthorized={mock()} />);
    await screen.findByText("1–50 of 120");

    const previous = screen.getByRole("button", { name: "Previous" });
    const next = screen.getByRole("button", { name: "Next" });
    expect(previous.hasAttribute("disabled")).toBe(true);

    fireEvent.click(next);
    await screen.findByText("51–100 of 120");
    fireEvent.click(next);
    await screen.findByText("101–120 of 120");
    await waitFor(() => expect(next.hasAttribute("disabled")).toBe(true));

    fireEvent.click(previous);
    await screen.findByText("51–100 of 120");
  });

  it("calls onUnauthorized when the session has ended", async () => {
    mockFetch(() => errorResponse(401));
    const onUnauthorized = mock();
    render(<BrandRequestsPage onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows an error when the list cannot load", async () => {
    mockFetch(() => errorResponse(500));
    render(<BrandRequestsPage onUnauthorized={mock()} />);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not load brand requests.",
    );
  });

  it("ignores a response that arrives after unmount", async () => {
    let resolve: (response: Response) => void = () => {};
    mockFetch(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    const onUnauthorized = mock();
    const { unmount } = render(
      <BrandRequestsPage onUnauthorized={onUnauthorized} />,
    );

    unmount();
    resolve(errorResponse(401));
    await new Promise((r) => setTimeout(r, 0));
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
