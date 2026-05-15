import { describe, expect, it, mock } from "bun:test";
import { fireEvent } from "@testing-library/react-native";

import { renderWithTheme } from "../../test/render";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders search input with placeholder", () => {
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar
        value=""
        onChangeText={() => {}}
        placeholder="Search cards..."
      />,
    );

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
  });

  it("hides clear control when value is empty", () => {
    const { queryByLabelText } = renderWithTheme(
      <SearchBar value="" onChangeText={() => {}} placeholder="Search..." />,
    );

    expect(queryByLabelText("Clear search")).toBeNull();
  });

  it("shows clear control when value is non-empty", () => {
    const { getByLabelText } = renderWithTheme(
      <SearchBar
        value="query"
        onChangeText={() => {}}
        placeholder="Search..."
      />,
    );

    expect(getByLabelText("Clear search")).toBeTruthy();
  });

  it("clears value when clear control is pressed", () => {
    const onChangeText = mock(() => {});
    const { getByLabelText } = renderWithTheme(
      <SearchBar
        value="query"
        onChangeText={onChangeText}
        placeholder="Search..."
      />,
    );

    fireEvent.press(getByLabelText("Clear search"));

    expect(onChangeText).toHaveBeenCalledWith("");
  });

  it("calls onChangeText when typing", () => {
    const onChangeText = mock(() => {});
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar
        value=""
        onChangeText={onChangeText}
        placeholder="Search..."
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Search..."), "asos");

    expect(onChangeText).toHaveBeenCalledWith("asos");
  });

  it("respects editable={false}", () => {
    const { getByPlaceholderText } = renderWithTheme(
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
