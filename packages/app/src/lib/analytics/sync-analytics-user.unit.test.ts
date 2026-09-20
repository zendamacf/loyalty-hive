import { beforeEach, describe, expect, it } from "bun:test";

import {
  clearUserMock,
  identifyUserMock,
  isInitializedMock,
} from "../../../test/mocks/expo-umami";
import { clearAnalyticsUser, syncAnalyticsUser } from "./sync-analytics-user";

describe("[Unit] syncAnalyticsUser", () => {
  beforeEach(() => {
    isInitializedMock.mockReturnValue(true);
    identifyUserMock.mockClear();
    clearUserMock.mockClear();
  });

  describe("syncAnalyticsUser", () => {
    it("identifies the analytics user", async () => {
      await syncAnalyticsUser("00000000-0000-4000-8000-000000000001");

      expect(identifyUserMock).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000001",
      );
    });

    it("no-ops when Umami is not initialized", () => {
      isInitializedMock.mockReturnValue(false);

      syncAnalyticsUser("00000000-0000-4000-8000-000000000001");

      expect(identifyUserMock).not.toHaveBeenCalled();
    });
  });

  describe("clearAnalyticsUser", () => {
    it("clears the analytics user identity", () => {
      clearAnalyticsUser();

      expect(clearUserMock).toHaveBeenCalledTimes(1);
    });

    it("no-ops when Umami is not initialized", () => {
      isInitializedMock.mockReturnValue(false);
      clearAnalyticsUser();

      expect(clearUserMock).toHaveBeenCalledTimes(1);
    });
  });
});
