import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import { Button } from "./Button";

describe("Button", () => {
  it("renders title and calls onPress", () => {
    const onPress = mock(() => {});
    const { getByText } = render(<Button title="Tap me" onPress={onPress} />);

    fireEvent.press(getByText("Tap me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = mock(() => {});
    const { UNSAFE_getByType } = render(
      <Button title="Tap me" onPress={onPress} disabled />,
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    expect(touchable.props.disabled).toBe(true);
    expect(touchable.props.accessibilityState?.disabled).toBe(true);
  });
});
