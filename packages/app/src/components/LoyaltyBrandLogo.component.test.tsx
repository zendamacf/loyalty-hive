import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render } from "@testing-library/react-native";
import { Image } from "react-native";

import { LoyaltyBrandLogo } from "./LoyaltyBrandLogo";

describe("[Component] LoyaltyBrandLogo", () => {
  it("renders provided logo", () => {
    const { UNSAFE_getByType } = render(
      <LoyaltyBrandLogo
        brand="Test Brand"
        height={48}
        logo="https://example.com/logo.png"
        onPress={() => {}}
      />,
    );

    const img = UNSAFE_getByType(Image);
    expect(img.props.source).toEqual({ uri: "https://example.com/logo.png" });
  });

  it("renders placeholder if no logo is provided", () => {
    const { getByText } = render(
      <LoyaltyBrandLogo brand="Test Brand" height={48} onPress={() => {}} />,
    );

    expect(getByText("Test Brand")).toBeTruthy();
  });

  it("invokes onPress when pressed", () => {
    const onPress = mock(() => {});
    const { getByLabelText } = render(
      <LoyaltyBrandLogo brand="Tap me" height={48} onPress={onPress} />,
    );

    fireEvent.press(getByLabelText("Tap me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
