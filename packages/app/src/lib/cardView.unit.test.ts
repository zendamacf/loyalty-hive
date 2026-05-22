import { describe, expect, it } from "bun:test";
import { resolveCardView, resolveCardViewFromBarcodeType } from "./cardView";

describe("[Unit] resolveCardViewFromBarcodeType", () => {
  it("maps 2D symbologies to 2D", () => {
    expect(resolveCardViewFromBarcodeType("qr")).toBe("2D");
    expect(resolveCardViewFromBarcodeType("aztec")).toBe("2D");
    expect(resolveCardViewFromBarcodeType("datamatrix")).toBe("2D");
    expect(resolveCardViewFromBarcodeType("pdf417")).toBe("2D");
  });

  it("maps linear symbologies to 1D", () => {
    expect(resolveCardViewFromBarcodeType("code128")).toBe("1D");
    expect(resolveCardViewFromBarcodeType("ean13")).toBe("1D");
    expect(resolveCardViewFromBarcodeType("upc_a")).toBe("1D");
  });

  it('defaults to "1D" for unknown types', () => {
    expect(resolveCardViewFromBarcodeType("unknown")).toBe("1D");
  });
});

describe("[Unit] resolveCardView", () => {
  it('returns "1D" when view is null, undefined, or unrecognized', () => {
    expect(resolveCardView(null)).toBe("1D");
    expect(resolveCardView(undefined)).toBe("1D");
    expect(resolveCardView("")).toBe("1D");
    expect(resolveCardView("3D")).toBe("1D");
  });

  it('returns "2D" when view is "2D"', () => {
    expect(resolveCardView("2D")).toBe("2D");
  });

  it('returns "1D" when view is "1D"', () => {
    expect(resolveCardView("1D")).toBe("1D");
  });
});
