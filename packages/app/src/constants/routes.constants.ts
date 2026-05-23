export enum Routes {
  LOGIN = "/",
  CARDS = "/cards",
  CARD_CODE = "/card-code",
  SELECT_BRAND = "/select-brand",
  SCAN = "/scan",
  SETTINGS = "/settings",
}

/** Set when navigating to card code from the cards list (triggers view logging). */
export const CARD_CODE_FROM_CARDS_PARAM = "fromCards";
export const CARD_CODE_FROM_CARDS_VALUE = "1";
