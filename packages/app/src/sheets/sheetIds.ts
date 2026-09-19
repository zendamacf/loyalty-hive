export const SheetIds = {
  CARD_DETAILS: "card-details",
  EDIT_CARD: "edit-card",
  DELETE_CARD: "delete-card",
  SCAN_MANUAL_ENTRY: "scan-manual-entry",
  REQUEST_BRAND: "request-brand",
} as const;

export type SheetId = (typeof SheetIds)[keyof typeof SheetIds];
