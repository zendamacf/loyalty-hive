import { beforeEach, describe, expect, it } from "bun:test";

import {
  clearUserMock,
  identifyUserMock,
} from "../../../test/mocks/expo-umami";
import { clearAnalyticsUser, syncAnalyticsUser } from "./sync-analytics-user";

describe("[Unit] syncAnalyticsUser", () => {
  beforeEach(() => {
    identifyUserMock.mockClear();
    clearUserMock.mockClear();
  });

  it("identifies the analytics user", async () => {
    await syncAnalyticsUser("00000000-0000-4000-8000-000000000001");

    expect(identifyUserMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
    );
  });

  it("clears the analytics user identity", () => {
    clearAnalyticsUser();

    expect(clearUserMock).toHaveBeenCalledTimes(1);
  });
});
