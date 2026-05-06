import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react-native";
import { FAB } from "./FAB";

describe("FAB", () => {
  it("renders plus symbol and calls onPress", () => {
    const onPress = mock(() => {});
    const { getByText } = render(<FAB onPress={onPress} />);

    fireEvent.press(getByText("+"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
