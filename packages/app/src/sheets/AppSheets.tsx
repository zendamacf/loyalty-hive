import { SheetRegister } from "react-native-actions-sheet";

import { CardDetailsSheet } from "./CardDetailsSheet";
import { DeleteCardSheet } from "./DeleteCardSheet";
import { EditCardSheet } from "./EditCardSheet";
import { ScanManualEntrySheet } from "./ScanManualEntrySheet";
import { SheetIds } from "./sheetIds";
import "./sheets.types";

export const AppSheets = () => (
  <SheetRegister
    sheets={{
      [SheetIds.CARD_DETAILS]: CardDetailsSheet,
      [SheetIds.EDIT_CARD]: EditCardSheet,
      [SheetIds.DELETE_CARD]: DeleteCardSheet,
      [SheetIds.SCAN_MANUAL_ENTRY]: ScanManualEntrySheet,
    }}
  />
);
