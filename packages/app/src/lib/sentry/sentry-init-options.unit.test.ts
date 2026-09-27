import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

import * as appVersion from "@/lib/app-version";

import { getSentryInitOptions } from "./sentry-init-options";

const mockAppVersion = "2.0.0";
const mockAppBuild = "99";
const mockAppRelease = `loyaltyhive@${mockAppVersion}`;

describe("[Unit] getSentryInitOptions", () => {
  beforeEach(() => {
    spyOn(appVersion, "getAppRelease").mockReturnValue(mockAppRelease);
    spyOn(appVersion, "getAppBuild").mockReturnValue(mockAppBuild);
  });

  afterEach(() => {
    mock.restore();
  });

  it("includes release metadata from the app version helpers", () => {
    expect(getSentryInitOptions()).toEqual(
      expect.objectContaining({
        release: mockAppRelease,
        dist: mockAppBuild,
        enabled: false,
        environment: "development",
      }),
    );
  });
});
