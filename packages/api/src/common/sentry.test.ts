import { describe, expect, it } from "bun:test";

import { API_PACKAGE_VERSION } from "../api-package";
import {
  captureBackgroundError,
  SENTRY_RELEASE,
  sentryOptions,
} from "./sentry";
import { dropExpectedErrors } from "./sentry-context";

describe("sentryOptions", () => {
  it("tags events with the API release and drops expected errors", () => {
    expect(SENTRY_RELEASE).toBe(`api@${API_PACKAGE_VERSION}`);
    expect(sentryOptions()).toMatchObject({
      release: SENTRY_RELEASE,
      beforeSend: dropExpectedErrors,
    });
  });
});

describe("captureBackgroundError", () => {
  it("does nothing when no DSN is set", () => {
    expect(() =>
      captureBackgroundError(new Error("boom"), "test"),
    ).not.toThrow();
  });
});
