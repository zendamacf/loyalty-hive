import { describe, expect, it } from "bun:test";
import { Text } from "react-native";

import { renderWithTheme } from "../../test/render";
import { FormGroup } from "./FormGroup";

describe("FormGroup", () => {
  it("renders label, hint, and children", async () => {
    const { getByText } = await renderWithTheme(
      <FormGroup label="Card number" hint="Enter the number on your card">
        <Text>Input</Text>
      </FormGroup>,
    );

    expect(getByText("Card number")).toBeTruthy();
    expect(getByText("Enter the number on your card")).toBeTruthy();
    expect(getByText("Input")).toBeTruthy();
  });
});
