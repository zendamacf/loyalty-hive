import { describe, expect, it, mock } from "bun:test";

import { changeText, press, renderWithProviders } from "../../test/render";
import { SearchBar } from "./SearchBar";

describe("[Integration] SearchBar", () => {
  it("renders search input with placeholder", async () => {
    const { getByPlaceholderText } = await renderWithProviders(
      <SearchBar
        value=""
        onChangeText={() => {}}
        placeholder="Search cards..."
      />,
    );

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
  });

  it("hides clear control when value is empty", async () => {
    const { queryByLabelText } = await renderWithProviders(
      <SearchBar value="" onChangeText={() => {}} placeholder="Search..." />,
    );

    expect(queryByLabelText("Clear search")).toBeNull();
  });

  it("shows clear control when value is non-empty", async () => {
    const { getByLabelText } = await renderWithProviders(
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
    const { getByLabelText } = await renderWithProviders(
      <SearchBar
        value="query"
        onChangeText={onChangeText}
        placeholder="Search..."
      />,
    );

    await press(getByLabelText("Clear search"));

    expect(onChangeText).toHaveBeenCalledWith("");
  });

  it("calls onChangeText when typing", async () => {
    const onChangeText = mock(() => {});
    const { getByPlaceholderText } = await renderWithProviders(
      <SearchBar
        value=""
        onChangeText={onChangeText}
        placeholder="Search..."
      />,
    );

    await changeText(getByPlaceholderText("Search..."), "asos");

    expect(onChangeText).toHaveBeenCalledWith("asos");
  });

  it("respects editable={false}", async () => {
    const { getByPlaceholderText } = await renderWithProviders(
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
