import { afterEach, describe, expect, it } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";

import { pathForRoute, routeFromPath, useRoute } from "./router";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/admin/");
});

describe("[Unit] router", () => {
  it("maps paths to routes", () => {
    expect(routeFromPath("/admin/users")).toBe("users");
    expect(routeFromPath("/admin/users/123")).toBe("users");
    expect(routeFromPath("/admin/brand-requests")).toBe("brand-requests");
    expect(routeFromPath("/admin/")).toBe("users");
    expect(routeFromPath("/admin")).toBe("users");
    expect(routeFromPath("/admin/unknown")).toBe("users");
  });

  it("builds paths under /admin", () => {
    expect(pathForRoute("users")).toBe("/admin/users");
  });

  it("starts from the current URL and navigates with history", () => {
    window.history.replaceState(null, "", "/admin/users");
    const { result } = renderHook(() => useRoute());
    expect(result.current[0]).toBe("users");

    act(() => result.current[1]("brand-requests"));
    expect(result.current[0]).toBe("brand-requests");
    expect(window.location.pathname).toBe("/admin/brand-requests");
  });

  it("follows the browser back button", () => {
    const { result } = renderHook(() => useRoute());
    act(() => {
      window.history.pushState(null, "", "/admin/users");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current[0]).toBe("users");
  });
});
