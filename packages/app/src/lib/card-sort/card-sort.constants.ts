import type { GetApiV1CardsData } from "@/lib/api-client";

export const CARD_SORT_STORAGE_KEY = "@loyalty-hive/card-sort";

export type CardListSort = NonNullable<
  NonNullable<GetApiV1CardsData["query"]>["sort"]
>;

export const CARD_SORT_OPTIONS = [
  "alphabetical",
  "most_viewed",
  "last_viewed",
] as const satisfies readonly CardListSort[];

export const DEFAULT_CARD_SORT: CardListSort = "alphabetical";

const CARD_SORT_SET = new Set<string>(CARD_SORT_OPTIONS);

export const isCardListSort = (value: string | null): value is CardListSort =>
  value != null && CARD_SORT_SET.has(value);
