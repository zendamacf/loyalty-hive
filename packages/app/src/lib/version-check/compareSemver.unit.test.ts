import { describe, expect, it } from "bun:test";

import {
  compareSemver,
  isBelowMinimumVersion,
  parseSemver,
} from "./compareSemver";

describe("[Unit] compareSemver", () => {
  it("parses valid semantic versions", () => {
    expect(parseSemver("1.2.3")).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
    });
  });

  it("returns null for invalid versions", () => {
    expect(parseSemver("1.2")).toBeNull();
    expect(parseSemver("unknown")).toBeNull();
  });

  it("compares semantic versions", () => {
    expect(compareSemver("1.0.0", "1.0.1")).toBe(-1);
    expect(compareSemver("2.0.0", "1.9.9")).toBe(1);
    expect(compareSemver("1.2.3", "1.2.3")).toBe(0);
  });

  it("treats invalid versions as not below minimum", () => {
    expect(isBelowMinimumVersion("unknown", "1.0.0")).toBe(false);
    expect(isBelowMinimumVersion("1.0.0", "invalid")).toBe(false);
  });

  it("detects when the current version is below the minimum", () => {
    expect(isBelowMinimumVersion("0.0.1", "1.0.0")).toBe(true);
    expect(isBelowMinimumVersion("1.1.10", "1.1.10")).toBe(false);
    expect(isBelowMinimumVersion("1.2.0", "1.1.10")).toBe(false);
  });
});
