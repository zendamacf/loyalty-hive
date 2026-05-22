import { describe, expect, it } from "bun:test";
import { localeFromDeviceCode } from "./resolveLocale";

describe("[Unit] localeFromDeviceCode", () => {
  it("maps Spanish device locales", () => {
    expect(localeFromDeviceCode("es")).toBe("es");
    expect(localeFromDeviceCode("es-MX")).toBe("es");
  });

  it("maps English device locales", () => {
    expect(localeFromDeviceCode("en")).toBe("en");
    expect(localeFromDeviceCode("en-US")).toBe("en");
  });

  it("falls back to en for unsupported or missing device locales", () => {
    expect(localeFromDeviceCode("fr")).toBe("en");
    expect(localeFromDeviceCode(null)).toBe("en");
  });
});
