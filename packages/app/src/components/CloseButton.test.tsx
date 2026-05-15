import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../test/render";
import { CloseButton } from "./CloseButton";

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    back: ReturnType<typeof mock>;
  };
};

describe("CloseButton", () => {
  beforeEach(() => {
    __expoRouterMocks.back.mockClear();
  });

  it("calls router.back by default", () => {
    const { getByLabelText } = renderWithProviders(<CloseButton />);

    fireEvent.press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalledTimes(1);
  });

  it("calls custom onPress when provided", () => {
    const onPress = mock(() => {});
    const { getByLabelText } = renderWithProviders(
      <CloseButton onPress={onPress} />,
    );

    fireEvent.press(getByLabelText("Close"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(__expoRouterMocks.back).not.toHaveBeenCalled();
  });
});
