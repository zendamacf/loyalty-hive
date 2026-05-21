import { describe, expect, it, mock } from "bun:test";
import { fireEvent } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { renderWithTheme } from "../../test/render";
import { Select } from "./Select";

describe("Select", () => {
  it("renders the selected option label on the trigger", async () => {
    const { getByText } = await renderWithTheme(
      <Select
        value="b"
        onValueChange={() => {}}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        accessibilityLabel="Example"
      />,
    );

    expect(getByText("Beta")).toBeTruthy();
  });

  it("shows options below the trigger when opened", async () => {
    const { getByLabelText, getByText, queryByText } = await renderWithTheme(
      <Select
        value="a"
        onValueChange={() => {}}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        accessibilityLabel="Example"
      />,
    );

    expect(queryByText("Beta")).toBeNull();

    fireEvent.press(getByLabelText("Example"));

    expect(getByText("Beta")).toBeTruthy();
  });

  it("calls onValueChange when an option is chosen", async () => {
    const onValueChange = mock(() => {});
    const { getByLabelText, getByText } = await renderWithTheme(
      <Select
        value="a"
        onValueChange={onValueChange}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        accessibilityLabel="Example"
      />,
    );

    fireEvent.press(getByLabelText("Example"));
    fireEvent.press(getByText("Beta"));

    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("opens the menu when a custom trigger is pressed", async () => {
    const { getByLabelText, getByText, queryByText } = await renderWithTheme(
      <Select
        value="a"
        onValueChange={() => {}}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        accessibilityLabel="Example"
        renderTrigger={({ onPress, accessibilityLabel: label }) => (
          <Pressable accessibilityLabel={label} onPress={onPress}>
            <Text>Custom</Text>
          </Pressable>
        )}
      />,
    );

    expect(queryByText("Beta")).toBeNull();

    fireEvent.press(getByLabelText("Example"));

    expect(getByText("Beta")).toBeTruthy();
  });
});
