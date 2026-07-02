import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react-native";
import { RefreshControl } from "react-native";

import { useThemedRefreshControl } from "./useThemedRefreshControl";

describe("[Unit] useThemedRefreshControl", () => {
  it("returns a RefreshControl element", async () => {
    const onRefresh = () => {};
    const { result } = await renderHook(() =>
      useThemedRefreshControl(false, onRefresh),
    );

    expect(result.current.type).toBe(RefreshControl);
    expect(result.current.props.refreshing).toBe(false);
    expect(result.current.props.onRefresh).toBe(onRefresh);
  });
});
