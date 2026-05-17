import { describe, expect, it } from "bun:test";

import { resolveCardHeadings } from "./cardHeadings";

describe("resolveCardHeadings", () => {
  it("uses brand name as title and label as subtitle when both are set", () => {
    expect(resolveCardHeadings("ASOS", "Work card")).toEqual({
      title: "ASOS",
      subtitle: "Work card",
    });
  });

  it("uses brand name as title when label is empty", () => {
    expect(resolveCardHeadings("ASOS", "")).toEqual({
      title: "ASOS",
    });
  });

  it("uses label as title when brand is not set", () => {
    expect(resolveCardHeadings("", "Gym membership")).toEqual({
      title: "Gym membership",
    });
  });
});
