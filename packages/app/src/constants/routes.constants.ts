export enum Routes {
  LOGIN = "/",
  CHECK_EMAIL = "/check-email",
  VERIFY_EMAIL = "/verify-email",
  FORGOT_PASSWORD = "/forgot-password",
  RESET_PASSWORD = "/reset-password",
  CARDS = "/cards",
  CARD_CODE = "/card-code",
  SELECT_BRAND = "/select-brand",
  SCAN = "/scan",
  SETTINGS = "/settings",
  ABOUT = "/about",
  ACCEPT_SHARE = "/accept-share",
}

/** Set when navigating to card code from the cards list (triggers view logging). */
export const CARD_CODE_FROM_CARDS_PARAM = "fromCards";
export const CARD_CODE_FROM_CARDS_VALUE = "1";
