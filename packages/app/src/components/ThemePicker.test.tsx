import { describe, expect, it } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { renderWithTheme } from "../../test/render";
import { ThemePicker } from "./ThemePicker";

describe("ThemePicker", () => {
  it("renders the current theme on the trigger", async () => {
    const { getByText } = await renderWithTheme(<ThemePicker />);

    expect(getByText("Light")).toBeTruthy();
  });

  it("shows light and dark options with icons when opened", async () => {
    const { getByLabelText, getByText } = await renderWithTheme(
      <ThemePicker />,
    );

    fireEvent.press(getByLabelText("Theme"));

    expect(getByText("sun")).toBeTruthy();
    expect(getByText("moon")).toBeTruthy();
  });

  it("changes theme when an option is selected", async () => {
    const { getByLabelText, getByText } = await renderWithTheme(
      <ThemePicker />,
    );

    fireEvent.press(getByLabelText("Theme"));
    fireEvent.press(getByText("Dark"));

    await waitFor(() => {
      expect(getByText("Dark")).toBeTruthy();
    });
  });
});
