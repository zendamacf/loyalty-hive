import { describe, expect, it } from "bun:test";

import { getAppBuild, getAppRelease, getAppVersion } from "./app-version";

describe("[Unit] app-version", () => {
  it("reads version and build from expo constants", () => {
    expect(getAppVersion()).toBe("1.1.8");
    expect(getAppBuild()).toBe("11");
    expect(getAppRelease()).toBe("loyaltyhive@1.1.8");
  });
});
