export const SheetIds = {
  CARD_DETAILS: "card-details",
  EDIT_CARD: "edit-card",
  DELETE_CARD: "delete-card",
  SHARE_CARD: "share-card",
  SCAN_MANUAL_ENTRY: "scan-manual-entry",
  REQUEST_BRAND: "request-brand",
  DELETE_ACCOUNT: "delete-account",
} as const;

export type SheetId = (typeof SheetIds)[keyof typeof SheetIds];
