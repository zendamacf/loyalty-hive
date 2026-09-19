import { beforeEach, describe, expect, it } from "bun:test";

import {
  isInitializedMock,
  trackEventMock,
} from "../../../test/mocks/expo-umami";
import { getUrlHost, trackBrandRequestSubmitted } from "./track-brand-request";

describe("trackBrandRequestSubmitted", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
    isInitializedMock.mockReturnValue(false);
  });

  it("does not track when Umami is not initialized", () => {
    trackBrandRequestSubmitted({
      request_id: "00000000-0000-4000-8000-000000000001",
      requested_name: "Coles",
      url_host: "www.coles.com.au",
      has_notes: false,
      source: "empty_search",
    });

    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it("tracks the brand request event when Umami is initialized", () => {
    isInitializedMock.mockReturnValue(true);

    trackBrandRequestSubmitted({
      request_id: "00000000-0000-4000-8000-000000000001",
      requested_name: "Coles",
      url_host: "www.coles.com.au",
      has_notes: true,
      source: "empty_search",
    });

    expect(trackEventMock).toHaveBeenCalledWith("/brand-request", {
      eventName: "brand_request_submitted",
      title: "Brand Request Submitted",
      data: {
        request_id: "00000000-0000-4000-8000-000000000001",
        requested_name: "Coles",
        url_host: "www.coles.com.au",
        has_notes: true,
        source: "empty_search",
      },
    });
  });
});

describe("getUrlHost", () => {
  it("returns the hostname for valid URLs", () => {
    expect(getUrlHost("https://www.coles.com.au/loyalty")).toBe(
      "www.coles.com.au",
    );
  });

  it("returns unknown for invalid URLs", () => {
    expect(getUrlHost("not-a-url")).toBe("unknown");
  });
});
