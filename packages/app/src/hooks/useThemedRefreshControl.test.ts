import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react-native";
import { RefreshControl } from "react-native";

import { useThemedRefreshControl } from "./useThemedRefreshControl";

describe("useThemedRefreshControl", () => {
  it("returns a RefreshControl element", () => {
    const onRefresh = () => {};
    const { result } = renderHook(() =>
      useThemedRefreshControl(false, onRefresh),
    );

    expect(result.current.type).toBe(RefreshControl);
    expect(result.current.props.refreshing).toBe(false);
    expect(result.current.props.onRefresh).toBe(onRefresh);
  });
});
