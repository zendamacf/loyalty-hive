import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { sentryInitMock } from "../../../test/mocks/sentry";
import { initSentry, resetSentryInitForTests } from "./init-sentry";

describe("[Unit] initSentry", () => {
  beforeEach(() => {
    resetSentryInitForTests();
    sentryInitMock.mockClear();
  });

  afterEach(() => {
    resetSentryInitForTests();
  });

  it("initializes Sentry with release metadata from the app version", () => {
    initSentry();

    expect(sentryInitMock).toHaveBeenCalledTimes(1);
    expect(sentryInitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        release: "loyaltyhive@1.1.8",
        dist: "11",
        enabled: false,
        environment: "development",
      }),
    );
  });

  it("only initializes once", () => {
    initSentry();
    initSentry();

    expect(sentryInitMock).toHaveBeenCalledTimes(1);
  });
});
