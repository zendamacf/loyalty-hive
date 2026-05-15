import { describe, expect, it } from "bun:test";
import { resolveCardView } from "./cardView";

describe("resolveCardView", () => {
  it('returns "1D" when view is null, undefined, or unrecognized', () => {
    expect(resolveCardView(null)).toBe("1D");
    expect(resolveCardView(undefined)).toBe("1D");
    expect(resolveCardView("")).toBe("1D");
    expect(resolveCardView("3D")).toBe("1D");
  });

  it('returns "2D" when view is "2D"', () => {
    expect(resolveCardView("2D")).toBe("2D");
  });

  it('returns "1D" when view is "1D"', () => {
    expect(resolveCardView("1D")).toBe("1D");
  });
});
