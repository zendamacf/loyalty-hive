import { describe, expect, it, mock } from "bun:test";
import { fireEvent } from "@testing-library/react-native";

import { renderWithTheme } from "../../test/render";

const onToggle = mock(() => {});

const { CardCodeViewToggle } = await import("./CardCodeViewToggle");

describe("CardCodeViewToggle", () => {
  it("shows barcode selected when view is 1D", () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <CardCodeViewToggle view="1D" onToggle={onToggle} />,
    );

    expect(getByLabelText("Barcode").props.accessibilityState?.selected).toBe(
      true,
    );
    expect(getByLabelText("QR code").props.accessibilityState?.selected).toBe(
      false,
    );
    expect(getByText("Barcode")).toBeTruthy();
    expect(getByText("QR code")).toBeTruthy();
  });

  it("shows QR code selected when view is 2D", () => {
    const { getByLabelText } = renderWithTheme(
      <CardCodeViewToggle view="2D" onToggle={onToggle} />,
    );

    expect(getByLabelText("Barcode").props.accessibilityState?.selected).toBe(
      false,
    );
    expect(getByLabelText("QR code").props.accessibilityState?.selected).toBe(
      true,
    );
  });

  it("calls onToggle when QR code is selected", () => {
    onToggle.mockClear();
    const { getByLabelText } = renderWithTheme(
      <CardCodeViewToggle view="1D" onToggle={onToggle} />,
    );

    fireEvent.press(getByLabelText("QR code"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle when barcode is selected", () => {
    onToggle.mockClear();
    const { getByLabelText } = renderWithTheme(
      <CardCodeViewToggle view="2D" onToggle={onToggle} />,
    );

    fireEvent.press(getByLabelText("Barcode"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("uses readable text on a dark brand color", () => {
    const { getByText } = renderWithTheme(
      <CardCodeViewToggle
        view="1D"
        activeSegmentColor="#0D1B2A"
        onToggle={onToggle}
      />,
    );

    expect(getByText("Barcode").props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#F1F5F9" })]),
    );
  });

  it("uses readable text on a light brand color", () => {
    const { getByText } = renderWithTheme(
      <CardCodeViewToggle
        view="2D"
        activeSegmentColor="#FFFFFF"
        onToggle={onToggle}
      />,
    );

    expect(getByText("QR code").props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#0F172A" })]),
    );
  });

  it("does not call onToggle when the current option is pressed again", () => {
    onToggle.mockClear();
    const { getByLabelText } = renderWithTheme(
      <CardCodeViewToggle view="1D" onToggle={onToggle} />,
    );

    fireEvent.press(getByLabelText("Barcode"));

    expect(onToggle).not.toHaveBeenCalled();
  });
});
