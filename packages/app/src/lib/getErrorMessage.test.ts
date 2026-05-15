import { describe, expect, it } from "bun:test";
import { getErrorMessage } from "./getErrorMessage";

describe("getErrorMessage", () => {
  it("returns error string from error object", () => {
    expect(getErrorMessage({ error: "Invalid credentials" })).toBe(
      "Invalid credentials",
    );
  });

  it("returns string errors as-is", () => {
    expect(getErrorMessage("Network failed")).toBe("Network failed");
  });

  it("returns fallback message for unknown errors", () => {
    expect(getErrorMessage(null)).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("returns fallback when error field is not a string", () => {
    expect(getErrorMessage({ error: 123 })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(getErrorMessage({ message: "Server error" })).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
