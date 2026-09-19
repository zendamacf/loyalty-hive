import { describe, expect, it } from "bun:test";

import { clientHeaders } from "./client-headers";

describe("[Unit] client-headers", () => {
  it("returns client identification headers", () => {
    expect(clientHeaders()).toEqual({
      "x-client-id": "loyaltyhive-app",
      "x-app-version": "1.1.8",
      "x-app-build": "11",
      "x-app-platform": "ios",
    });
  });
});
