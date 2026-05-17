import type { BarcodeType } from "expo-camera";

export type CardView = "1D" | "2D";

const BARCODE_TYPE_TO_CARD_VIEW: Record<BarcodeType, CardView> = {
  aztec: "2D",
  datamatrix: "2D",
  pdf417: "2D",
  qr: "2D",
  codabar: "1D",
  code39: "1D",
  code93: "1D",
  code128: "1D",
  ean8: "1D",
  ean13: "1D",
  itf14: "1D",
  upc_a: "1D",
  upc_e: "1D",
} as const satisfies Record<BarcodeType, CardView>;

export function resolveCardViewFromBarcodeType(
  barcodeType: BarcodeType | string,
): CardView {
  if (barcodeType in BARCODE_TYPE_TO_CARD_VIEW) {
    return BARCODE_TYPE_TO_CARD_VIEW[barcodeType as BarcodeType];
  }
  return "1D";
}

export function resolveCardView(view: string | null | undefined): CardView {
  return view === "2D" ? "2D" : "1D";
}
