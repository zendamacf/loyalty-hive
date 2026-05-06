import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react-native";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders search input with expected placeholder", () => {
    const { getByPlaceholderText } = render(<SearchBar />);

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
  });
});
