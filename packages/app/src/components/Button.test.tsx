import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react-native";
import { Button } from "./Button";

describe("Button", () => {
  it("renders title and calls onPress", () => {
    const onPress = mock(() => {});
    const { getByText } = render(<Button title="Tap me" onPress={onPress} />);

    fireEvent.press(getByText("Tap me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
