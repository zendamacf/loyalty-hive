import { describe, expect, it } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithTheme } from "../../test/render";

const { ThemeToggle } = await import("./ThemeToggle");

describe("ThemeToggle", () => {
  it("renders icon only by default", () => {
    const { getByLabelText, getByText, queryByText } = renderWithTheme(
      <ThemeToggle />,
    );

    expect(getByLabelText("Use dark theme")).toBeTruthy();
    expect(getByText("sun")).toBeTruthy();
    expect(queryByText("Light")).toBeNull();
  });

  it("renders label when showLabel is true", () => {
    const { getByText } = renderWithTheme(<ThemeToggle showLabel />);

    expect(getByText("Light")).toBeTruthy();
    expect(getByText("sun")).toBeTruthy();
  });

  it("toggles theme on press", async () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <ThemeToggle showLabel />,
    );

    fireEvent.press(getByLabelText("Use dark theme"));

    await waitFor(() => {
      expect(getByLabelText("Use light theme")).toBeTruthy();
      expect(getByText("moon")).toBeTruthy();
      expect(getByText("Dark")).toBeTruthy();
    });
  });
});
