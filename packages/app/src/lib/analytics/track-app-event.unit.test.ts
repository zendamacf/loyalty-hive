import { beforeEach, describe, expect, it } from "bun:test";

import {
  flushMock,
  isInitializedMock,
  trackCustomEventMock,
} from "../../../test/mocks/expo-umami";
import { AnalyticsEvents } from "./analytics-events";
import {
  clearBufferedAnalyticsEvents,
  flushBufferedAnalyticsEvents,
  getBufferedAnalyticsEventCount,
  resetAnalyticsIdentityForTests,
  setAnalyticsIdentityMode,
} from "./analytics-state";
import { trackAppEvent } from "./track-app-event";

describe("[Unit] trackAppEvent", () => {
  beforeEach(() => {
    resetAnalyticsIdentityForTests();
    clearBufferedAnalyticsEvents();
    trackCustomEventMock.mockClear();
    flushMock.mockClear();
    isInitializedMock.mockReset();
    isInitializedMock.mockReturnValue(true);
    setAnalyticsIdentityMode("identified");
  });

  it("sends a custom event when Umami is initialized", async () => {
    await trackAppEvent(AnalyticsEvents.CARDS_SORT, { sort: "alphabetical" });

    expect(trackCustomEventMock).toHaveBeenCalledWith(
      "/events/cards_sort",
      "cards_sort",
      { data: { sort: "alphabetical" } },
    );
  });

  it("omits null and undefined data values", async () => {
    await trackAppEvent(AnalyticsEvents.CARD_ADD, {
      method: "scan",
      brand_id: null,
      view: undefined,
      is_custom_card: false,
    });

    expect(trackCustomEventMock).toHaveBeenCalledWith(
      "/events/card_add",
      "card_add",
      { data: { method: "scan", is_custom_card: false } },
    );
  });

  it("no-ops when Umami is not initialized", async () => {
    isInitializedMock.mockReturnValue(false);

    await trackAppEvent(AnalyticsEvents.AUTH_LOGIN);

    expect(trackCustomEventMock).not.toHaveBeenCalled();
  });

  it("no-ops while analytics identity is still pending", async () => {
    setAnalyticsIdentityMode("pending");

    await trackAppEvent(AnalyticsEvents.AUTH_LOGIN);

    expect(trackCustomEventMock).not.toHaveBeenCalled();
    expect(getBufferedAnalyticsEventCount()).toBe(0);
  });

  it("buffers events while tracking is deferred", async () => {
    setAnalyticsIdentityMode("deferred");

    await trackAppEvent(AnalyticsEvents.AUTH_SIGNUP);

    expect(trackCustomEventMock).not.toHaveBeenCalled();
    expect(getBufferedAnalyticsEventCount()).toBe(1);
  });

  it("sends buffered events when the buffer is flushed", async () => {
    setAnalyticsIdentityMode("deferred");

    await trackAppEvent(AnalyticsEvents.AUTH_SIGNUP);
    await flushBufferedAnalyticsEvents();

    expect(trackCustomEventMock).toHaveBeenCalledWith(
      "/events/auth_signup",
      "auth_signup",
      undefined,
    );
    expect(flushMock).toHaveBeenCalledTimes(1);
    expect(getBufferedAnalyticsEventCount()).toBe(0);
  });
});
