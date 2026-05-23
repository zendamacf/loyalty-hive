import { SheetManager } from "react-native-actions-sheet";
import { SheetIds } from "./sheetIds";
import type {
  CardDetailsSheetPayload,
  DeleteCardSheetPayload,
  EditCardSheetPayload,
  ScanManualEntrySheetPayload,
} from "./sheets.types";

export { AppSheets } from "./AppSheets";
export { SheetIds } from "./sheetIds";

export const showCardDetailsSheet = (payload: CardDetailsSheetPayload) =>
  SheetManager.show(SheetIds.CARD_DETAILS, { payload });

export const showEditCardSheet = (payload: EditCardSheetPayload) =>
  SheetManager.show(SheetIds.EDIT_CARD, { payload });

export const showDeleteCardSheet = (payload: DeleteCardSheetPayload) =>
  SheetManager.show(SheetIds.DELETE_CARD, { payload });

export const showScanManualEntrySheet = (
  payload: ScanManualEntrySheetPayload,
) => SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, { payload });
