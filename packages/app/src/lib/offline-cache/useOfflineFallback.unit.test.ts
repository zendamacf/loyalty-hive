import { describe, expect, it, mock } from "bun:test";

import { renderHook, waitFor } from "@testing-library/react-native";

import { useOfflineFallback } from "./useOfflineFallback";

type Query = {
  data: string[] | undefined;
  isSuccess: boolean;
  isError: boolean;
};

const pending: Query = { data: undefined, isSuccess: false, isError: false };

async function setup(
  initialQuery: Query,
  load: () => Promise<string[] | null>,
) {
  const save = mock(async (_value: string[]) => {});
  const hook = await renderHook(
    ({ query, key }: { query: Query; key: string }) =>
      useOfflineFallback(query, { key, load, save }),
    { initialProps: { query: initialQuery, key: "a" } },
  );
  return { save, ...hook };
}

describe("[Unit] useOfflineFallback", () => {
  it("serves the saved copy while the fetch is pending", async () => {
    const { result } = await setup(pending, async () => ["saved"]);

    await waitFor(() => expect(result.current.data).toEqual(["saved"]));
    expect(result.current.isOffline).toBe(false);
  });

  it("prefers fresh data and saves it", async () => {
    const { result, save, rerender } = await setup(pending, async () => [
      "saved",
    ]);
    await waitFor(() => expect(result.current.data).toEqual(["saved"]));

    const fresh = ["fresh"];
    await rerender({
      query: { data: fresh, isSuccess: true, isError: false },
      key: "a",
    });

    expect(result.current.data).toEqual(fresh);
    expect(save).toHaveBeenCalledWith(fresh);
  });

  it("reports offline when the fetch fails but saved data exists", async () => {
    const { result } = await setup(
      { data: undefined, isSuccess: false, isError: true },
      async () => ["saved"],
    );

    await waitFor(() => expect(result.current.isOffline).toBe(true));
    expect(result.current.data).toEqual(["saved"]);
  });

  it("is not offline when nothing is saved", async () => {
    const { result } = await setup(
      { data: undefined, isSuccess: false, isError: true },
      async () => null,
    );

    await waitFor(() => expect(result.current.data).toBeUndefined());
    expect(result.current.isOffline).toBe(false);
  });

  it("ignores the saved copy of a different key", async () => {
    const load = mock(async () => ["saved-a"]);
    const { result, rerender } = await setup(pending, load);
    await waitFor(() => expect(result.current.data).toEqual(["saved-a"]));

    load.mockImplementation(async () => new Promise(() => {}));
    await rerender({ query: pending, key: "b" });

    expect(result.current.data).toBeUndefined();
  });
});
