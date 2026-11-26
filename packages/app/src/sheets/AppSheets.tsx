import { SheetRegister } from "react-native-actions-sheet";

import { CardDetailsSheet } from "./CardDetailsSheet";
import { DeleteAccountSheet } from "./DeleteAccountSheet";
import { DeleteCardSheet } from "./DeleteCardSheet";
import { EditCardSheet } from "./EditCardSheet";
import { RequestBrandSheet } from "./RequestBrandSheet";
import { ScanManualEntrySheet } from "./ScanManualEntrySheet";
import { ShareCardSheet } from "./ShareCardSheet";
import { SheetIds } from "./sheetIds";
import "./sheets.types";

export const AppSheets = () => (
  <SheetRegister
    sheets={{
      [SheetIds.CARD_DETAILS]: CardDetailsSheet,
      [SheetIds.EDIT_CARD]: EditCardSheet,
      [SheetIds.DELETE_CARD]: DeleteCardSheet,
      [SheetIds.SHARE_CARD]: ShareCardSheet,
      [SheetIds.SCAN_MANUAL_ENTRY]: ScanManualEntrySheet,
      [SheetIds.REQUEST_BRAND]: RequestBrandSheet,
      [SheetIds.DELETE_ACCOUNT]: DeleteAccountSheet,
    }}
  />
);
