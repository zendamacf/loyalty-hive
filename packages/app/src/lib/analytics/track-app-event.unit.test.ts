import { beforeEach, describe, expect, it } from "bun:test";

import {
  isInitializedMock,
  trackCustomEventMock,
} from "../../../test/mocks/expo-umami";
import { AnalyticsEvents } from "./analytics-events";
import { trackAppEvent } from "./track-app-event";

describe("[Unit] trackAppEvent", () => {
  beforeEach(() => {
    trackCustomEventMock.mockClear();
    isInitializedMock.mockReset();
    isInitializedMock.mockReturnValue(true);
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
});
