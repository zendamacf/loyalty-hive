import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react-native";

import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders search input with placeholder", () => {
    const { getByPlaceholderText } = render(
      <SearchBar
        value=""
        onChangeText={() => {}}
        placeholder="Search cards..."
      />,
    );

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
  });
});
