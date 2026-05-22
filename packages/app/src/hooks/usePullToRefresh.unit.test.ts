import { describe, expect, it, mock } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { usePullToRefresh } from "./usePullToRefresh";

describe("[Unit] usePullToRefresh", () => {
  it("calls refetch and toggles refreshing on onRefresh", async () => {
    const refetch = mock(() => Promise.resolve());
    const { result } = renderHook(() => usePullToRefresh(refetch));

    expect(result.current.refreshing).toBe(false);

    await act(async () => {
      void result.current.onRefresh();
    });

    expect(refetch).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
    });
  });
});
