import { describe, expect, it } from "bun:test";

import { getSentryInitOptions } from "./sentry-init-options";

describe("[Unit] getSentryInitOptions", () => {
  it("includes release metadata from the app version", () => {
    expect(getSentryInitOptions()).toEqual(
      expect.objectContaining({
        release: "loyaltyhive@1.1.8",
        dist: "11",
        enabled: false,
        environment: "development",
      }),
    );
  });
});
