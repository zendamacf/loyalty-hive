import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react-native";
import { Button } from "./Button";

describe("[Component] Button", () => {
  it("renders title and calls onPress", async () => {
    const onPress = mock(() => {});
    const { getByText } = await render(
      <Button title="Tap me" onPress={onPress} />,
    );

    fireEvent.press(getByText("Tap me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", async () => {
    const onPress = mock(() => {});
    const { container } = await render(
      <Button title="Tap me" onPress={onPress} disabled />,
    );

    const [touchable] = container.queryAll(
      (node) => node.type === "TouchableOpacity",
    );
    expect(touchable.props.disabled).toBe(true);
    expect(touchable.props.accessibilityState?.disabled).toBe(true);
  });
});
