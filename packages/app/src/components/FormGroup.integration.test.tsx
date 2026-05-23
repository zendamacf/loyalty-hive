import { describe, expect, it } from "bun:test";
import { Text } from "react-native";

import { renderWithProviders } from "../../test/render";
import { FormGroup } from "./FormGroup";

describe("[Integration] FormGroup", () => {
  it("renders label, hint, and children", async () => {
    const { getByText } = await renderWithProviders(
      <FormGroup label="Card number" hint="Enter the number on your card">
        <Text>Input</Text>
      </FormGroup>,
    );

    expect(getByText("Card number")).toBeTruthy();
    expect(getByText("Enter the number on your card")).toBeTruthy();
    expect(getByText("Input")).toBeTruthy();
  });
});
