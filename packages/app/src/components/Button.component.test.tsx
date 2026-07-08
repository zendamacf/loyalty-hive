import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import { Button } from "./Button";

describe("[Component] Button", () => {
  it("renders title and calls onPress", async () => {
    const onPress = mock(() => {});
    const { getByText } = await render(
      <Button title="Tap me" onPress={onPress} />,
    );

    await fireEvent.press(getByText("Tap me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", async () => {
    const onPress = mock(() => {});
    const { UNSAFE_getByType } = await render(
      <Button title="Tap me" onPress={onPress} disabled />,
    );

    const touchable = UNSAFE_getByType(TouchableOpacity);
    expect(touchable.props.disabled).toBe(true);
    expect(touchable.props.accessibilityState?.disabled).toBe(true);
  });
});
