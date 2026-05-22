import { describe, expect, it } from "bun:test";

import { waitFor } from "@testing-library/react-native";

import { press, renderWithTheme } from "../../test/render";
import { ThemePicker } from "./ThemePicker";

describe("ThemePicker", () => {
  it("renders system theme by default on the trigger", async () => {
    const { getByText } = await renderWithTheme(<ThemePicker />);

    expect(getByText("System")).toBeTruthy();
  });

  it("shows all theme options with icons when opened", async () => {
    const { getAllByTestId, getByLabelText, getByTestId } =
      await renderWithTheme(<ThemePicker />);

    await press(getByLabelText("Theme"));

    await waitFor(() => {
      expect(getAllByTestId("system-theme-swatch").length).toBe(2);
      expect(getByTestId("light-theme-swatch")).toBeTruthy();
      expect(getByTestId("dark-theme-swatch")).toBeTruthy();
      expect(getByTestId("purple-theme-swatch")).toBeTruthy();
    });
  });

  it("selects purple theme", async () => {
    const { getByLabelText, getByText } = await renderWithTheme(
      <ThemePicker />,
    );

    await press(getByLabelText("Theme"));
    await press(getByText("Purple"));

    await waitFor(() => {
      expect(getByText("Purple")).toBeTruthy();
    });
  });

  it("changes theme when an option is selected", async () => {
    const { getByLabelText, getByText } = await renderWithTheme(
      <ThemePicker />,
    );

    await press(getByLabelText("Theme"));
    await press(getByText("Dark"));

    await waitFor(() => {
      expect(getByText("Dark")).toBeTruthy();
    });
  });
});
