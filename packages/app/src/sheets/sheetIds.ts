export const SheetIds = {
  CARD_DETAILS: "card-details",
  EDIT_CARD: "edit-card",
  DELETE_CARD: "delete-card",
} as const;

export type SheetId = (typeof SheetIds)[keyof typeof SheetIds];
