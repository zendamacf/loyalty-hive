import { beforeEach, describe, expect, it, mock } from "bun:test";
import { press, renderWithProviders } from "../../test/render";
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

  it("calls router.back by default", async () => {
    const { getByLabelText } = await renderWithProviders(<CloseButton />);

    await press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalledTimes(1);
  });

  it("calls custom onPress when provided", async () => {
    const onPress = mock(() => {});
    const { getByLabelText } = await renderWithProviders(
      <CloseButton onPress={onPress} />,
    );

    await press(getByLabelText("Close"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(__expoRouterMocks.back).not.toHaveBeenCalled();
  });
});
