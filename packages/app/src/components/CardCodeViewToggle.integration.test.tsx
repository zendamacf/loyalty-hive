import { describe, expect, it, mock } from "bun:test";

import { press, renderWithProviders } from "../../test/render";

const onToggle = mock(() => {});

const { CardCodeViewToggle } = await import("./CardCodeViewToggle");

describe("[Integration] CardCodeViewToggle", () => {
  it("shows barcode selected when view is 1D", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
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

  it("shows QR code selected when view is 2D", async () => {
    const { getByLabelText } = await renderWithProviders(
      <CardCodeViewToggle view="2D" onToggle={onToggle} />,
    );

    expect(getByLabelText("Barcode").props.accessibilityState?.selected).toBe(
      false,
    );
    expect(getByLabelText("QR code").props.accessibilityState?.selected).toBe(
      true,
    );
  });

  it("calls onToggle when QR code is selected", async () => {
    onToggle.mockClear();
    const { getByLabelText } = await renderWithProviders(
      <CardCodeViewToggle view="1D" onToggle={onToggle} />,
    );

    await press(getByLabelText("QR code"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle when barcode is selected", async () => {
    onToggle.mockClear();
    const { getByLabelText } = await renderWithProviders(
      <CardCodeViewToggle view="2D" onToggle={onToggle} />,
    );

    await press(getByLabelText("Barcode"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("uses readable text on a dark brand color", async () => {
    const { getByText } = await renderWithProviders(
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

  it("uses readable text on a light brand color", async () => {
    const { getByText } = await renderWithProviders(
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

  it("does not call onToggle when the current option is pressed again", async () => {
    onToggle.mockClear();
    const { getByLabelText } = await renderWithProviders(
      <CardCodeViewToggle view="1D" onToggle={onToggle} />,
    );

    await press(getByLabelText("Barcode"));

    expect(onToggle).not.toHaveBeenCalled();
  });
});
