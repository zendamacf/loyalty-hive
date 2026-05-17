import { describe, expect, it } from "bun:test";

import { getReadableTextColor, parseCssColor } from "./readableTextColor";

describe("parseCssColor", () => {
  it("parses 6-digit hex", () => {
    expect(parseCssColor("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses 3-digit hex", () => {
    expect(parseCssColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses rgb()", () => {
    expect(parseCssColor("rgb(15, 23, 42)")).toEqual({ r: 15, g: 23, b: 42 });
  });
});

describe("getReadableTextColor", () => {
  it("returns dark text on light backgrounds", () => {
    expect(getReadableTextColor("#FFFFFF")).toBe("#0F172A");
    expect(getReadableTextColor("#FFC43D")).toBe("#0F172A");
  });

  it("returns light text on dark backgrounds", () => {
    expect(getReadableTextColor("#0D1B2A")).toBe("#F1F5F9");
    expect(getReadableTextColor("#000000")).toBe("#F1F5F9");
  });

  it("falls back to dark text for invalid colors", () => {
    expect(getReadableTextColor("not-a-color")).toBe("#0F172A");
  });
});
