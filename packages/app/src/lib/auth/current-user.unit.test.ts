import { beforeEach, describe, expect, it } from "bun:test";

import { getApiV1AuthMeMock } from "../../../test/mocks/api-client";
import { fetchCurrentUser } from "./current-user";

describe("[Unit] fetchCurrentUser", () => {
  beforeEach(() => {
    getApiV1AuthMeMock.mockClear();
  });

  it("returns the current user when /me succeeds", async () => {
    getApiV1AuthMeMock.mockImplementation(() =>
      Promise.resolve({
        data: { id: "00000000-0000-4000-8000-000000000001" },
        error: undefined,
      }),
    );

    await expect(fetchCurrentUser()).resolves.toEqual({
      id: "00000000-0000-4000-8000-000000000001",
    });
  });

  it("returns null when /me returns an error", async () => {
    getApiV1AuthMeMock.mockImplementation(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Unauthorized" },
      }),
    );

    await expect(fetchCurrentUser()).resolves.toBeNull();
  });
});
