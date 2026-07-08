import { describe, expect, it, mock } from "bun:test";

import { fireEvent, render } from "@testing-library/react-native";

import { LoyaltyBrandLogo } from "./LoyaltyBrandLogo";

describe("[Component] LoyaltyBrandLogo", () => {
  it("renders provided logo", async () => {
    const { getByTestId } = await render(
      <LoyaltyBrandLogo
        brand="Test Brand"
        height={48}
        logo="https://example.com/logo.png"
        onPress={() => {}}
      />,
    );

    const img = getByTestId("brand-logo");
    expect(img.props.source).toEqual({ uri: "https://example.com/logo.png" });
  });

  it("renders placeholder if no logo is provided", async () => {
    const { getByText } = await render(
      <LoyaltyBrandLogo brand="Test Brand" height={48} onPress={() => {}} />,
    );

    expect(getByText("Test Brand")).toBeTruthy();
  });

  it("invokes onPress when pressed", async () => {
    const onPress = mock(() => {});
    const { getByLabelText } = await render(
      <LoyaltyBrandLogo brand="Tap me" height={48} onPress={onPress} />,
    );

    await fireEvent.press(getByLabelText("Tap me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
