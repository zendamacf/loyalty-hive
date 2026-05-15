import { describe, expect, it, mock } from "bun:test";
import { fireEvent } from "@testing-library/react-native";
import { renderWithTheme } from "../../test/render";

const onToggle = mock(() => {});

const { CardCodeViewToggle } = await import("./CardCodeViewToggle");

describe("CardCodeViewToggle", () => {
  it("offers QR code when view is 1D", () => {
    const { getByLabelText } = renderWithTheme(
      <CardCodeViewToggle view="1D" onToggle={onToggle} />,
    );

    expect(getByLabelText("QR code")).toBeTruthy();
  });

  it("offers barcode when view is 2D", () => {
    const { getByLabelText } = renderWithTheme(
      <CardCodeViewToggle view="2D" onToggle={onToggle} />,
    );

    expect(getByLabelText("Barcode")).toBeTruthy();
  });

  it("calls onToggle when pressed", () => {
    onToggle.mockClear();
    const { getByLabelText } = renderWithTheme(
      <CardCodeViewToggle view="1D" onToggle={onToggle} />,
    );

    fireEvent.press(getByLabelText("QR code"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
