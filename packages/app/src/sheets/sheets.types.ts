import type { SheetDefinition } from "react-native-actions-sheet";

import type { CardView } from "@/lib/cardView";

import type { SheetIds } from "./sheetIds";

export type CardDetailsSheetPayload = {
  cardNumber: string;
  createdAt?: string;
};

export type EditCardSheetPayload = {
  cardId: string;
  label: string;
  defaultView: CardView;
  brandName?: string;
  activeSegmentColor?: string;
};

export type EditCardSheetReturnValue = {
  label: string;
  view: CardView;
};

export type DeleteCardSheetPayload = {
  cardId: string;
};

declare module "react-native-actions-sheet" {
  interface Sheets {
    [SheetIds.CARD_DETAILS]: SheetDefinition<{
      payload: CardDetailsSheetPayload;
    }>;
    [SheetIds.EDIT_CARD]: SheetDefinition<{
      payload: EditCardSheetPayload;
      returnValue: EditCardSheetReturnValue;
    }>;
    [SheetIds.DELETE_CARD]: SheetDefinition<{
      payload: DeleteCardSheetPayload;
    }>;
  }
}
