import { beforeEach, describe, expect, it, mock } from "bun:test";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import { press, renderWithProviders } from "../../test/render";
import { CloseButton } from "./CloseButton";

const expoRouterMocks = getExpoRouterMocks();

describe("[Integration] CloseButton", () => {
  beforeEach(() => {
    expoRouterMocks.back.mockClear();
  });

  it("calls router.back by default", async () => {
    const { getByLabelText } = await renderWithProviders(<CloseButton />);

    await press(getByLabelText("Close"));

    expect(expoRouterMocks.back).toHaveBeenCalledTimes(1);
  });

  it("calls custom onPress when provided", async () => {
    const onPress = mock(() => {});
    const { getByLabelText } = await renderWithProviders(
      <CloseButton onPress={onPress} />,
    );

    await press(getByLabelText("Close"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(expoRouterMocks.back).not.toHaveBeenCalled();
  });
});
