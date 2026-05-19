import { describe, expect, it, mock } from "bun:test";
import { fireEvent } from "@testing-library/react-native";

import { renderWithTheme } from "../../test/render";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders search input with placeholder", async () => {
    const { getByPlaceholderText } = await renderWithTheme(
      <SearchBar
        value=""
        onChangeText={() => {}}
        placeholder="Search cards..."
      />,
    );

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
  });

  it("hides clear control when value is empty", async () => {
    const { queryByLabelText } = await renderWithTheme(
      <SearchBar value="" onChangeText={() => {}} placeholder="Search..." />,
    );

    expect(queryByLabelText("Clear search")).toBeNull();
  });

  it("shows clear control when value is non-empty", async () => {
    const { getByLabelText } = await renderWithTheme(
      <SearchBar
        value="query"
        onChangeText={() => {}}
        placeholder="Search..."
      />,
    );

    expect(getByLabelText("Clear search")).toBeTruthy();
  });

  it("clears value when clear control is pressed", async () => {
    const onChangeText = mock(() => {});
    const { getByLabelText } = await renderWithTheme(
      <SearchBar
        value="query"
        onChangeText={onChangeText}
        placeholder="Search..."
      />,
    );

    fireEvent.press(getByLabelText("Clear search"));

    expect(onChangeText).toHaveBeenCalledWith("");
  });

  it("calls onChangeText when typing", async () => {
    const onChangeText = mock(() => {});
    const { getByPlaceholderText } = await renderWithTheme(
      <SearchBar
        value=""
        onChangeText={onChangeText}
        placeholder="Search..."
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Search..."), "asos");

    expect(onChangeText).toHaveBeenCalledWith("asos");
  });

  it("respects editable={false}", async () => {
    const { getByPlaceholderText } = await renderWithTheme(
      <SearchBar
        value=""
        onChangeText={() => {}}
        placeholder="Search..."
        editable={false}
      />,
    );

    expect(getByPlaceholderText("Search...").props.editable).toBe(false);
  });
});
