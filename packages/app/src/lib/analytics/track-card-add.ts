import { AnalyticsEvents } from "./analytics-events";
import { trackAppEvent } from "./track-app-event";

type CardAddMethod = "scan" | "manual";

type TrackCardAddOptions = {
  method: CardAddMethod;
  isCustomCard: boolean;
  brandId: string | null;
  view?: string | null;
};

export function trackCardAdd({
  method,
  isCustomCard,
  brandId,
  view,
}: TrackCardAddOptions): void {
  void trackAppEvent(AnalyticsEvents.CARD_ADD, {
    method,
    is_custom_card: isCustomCard,
    brand_id: brandId,
    view,
  });
}
