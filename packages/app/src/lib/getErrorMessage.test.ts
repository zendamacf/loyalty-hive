import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { getErrorMessage } from "./getErrorMessage";

const consoleErrorMock = mock(() => {});

describe("getErrorMessage", () => {
  beforeEach(() => {
    consoleErrorMock.mockClear();
    console.error = consoleErrorMock as typeof console.error;
  });

  afterEach(() => {
    console.error = globalThis.console.error;
  });

  it("returns error string from error object", () => {
    expect(getErrorMessage({ error: "Invalid credentials" })).toBe(
      "Invalid credentials",
    );
    expect(consoleErrorMock).not.toHaveBeenCalled();
  });

  it("returns string errors as-is", () => {
    expect(getErrorMessage("Network failed")).toBe("Network failed");
    expect(consoleErrorMock).not.toHaveBeenCalled();
  });

  it("returns fallback message for unknown errors", () => {
    expect(getErrorMessage(null)).toBe(
      "Something went wrong. Please try again.",
    );
    expect(consoleErrorMock).toHaveBeenCalledWith(null);
  });

  it("returns fallback when error field is not a string", () => {
    expect(getErrorMessage({ error: 123 })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(getErrorMessage({ message: "Server error" })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(consoleErrorMock).toHaveBeenCalledTimes(2);
  });
});
