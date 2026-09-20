export const AnalyticsEvents = {
  AUTH_LOGIN: "auth_login",
  AUTH_SIGNUP: "auth_signup",
  AUTH_SIGN_OUT: "auth_sign_out",
  CARDS_SORT: "cards_sort",
  CARDS_SEARCH: "cards_search",
  CARD_EDIT: "card_edit",
  CARD_DELETE: "card_delete",
  CARD_VIEW_DETAILS: "card_view_details",
  CARD_VIEW_CODE: "card_view_code",
  BRANDS_SEARCH: "brands_search",
  CARD_ADD: "card_add",
  SETTINGS_THEME_CHANGE: "settings_theme_change",
  SETTINGS_LANGUAGE_CHANGE: "settings_language_change",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
