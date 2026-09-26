import { dispatchTrackEvent } from "./analytics-state";

export type BrandRequestSubmittedData = {
  request_id: string;
  requested_name: string;
  url_host: string;
  has_notes: boolean;
  source: "empty_search";
};

export function trackBrandRequestSubmitted(
  data: BrandRequestSubmittedData,
): void {
  void dispatchTrackEvent("/brand-request", {
    eventName: "brand_request_submitted",
    title: "Brand Request Submitted",
    data,
  });
}

export function getUrlHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}
