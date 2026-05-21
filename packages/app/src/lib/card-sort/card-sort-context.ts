import { createContext, useContext } from "react";
import type { CardListSort } from "./card-sort.constants";

export type CardSortContextValue = {
  sort: CardListSort;
  hydrated: boolean;
  setSort: (sort: CardListSort) => void;
};

export const CardSortContext = createContext<CardSortContextValue | null>(null);

export const useCardSort = () => {
  const context = useContext(CardSortContext);
  if (context == null) {
    throw new Error("useCardSort must be used within UserPreferencesProvider");
  }
  return context;
};
