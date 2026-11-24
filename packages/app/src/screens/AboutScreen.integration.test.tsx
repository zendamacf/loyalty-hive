import { beforeEach, describe, expect, it } from "bun:test";

import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import { press, renderWithProviders } from "../../test/render";

const expoRouterMocks = getExpoRouterMocks();

const { AboutScreen } = await import("./AboutScreen");

describe("[Integration] AboutScreen", () => {
  beforeEach(() => {
    expoRouterMocks.back.mockClear();
  });

  it("shows the brand disclaimer", async () => {
    const { getByText } = await renderWithProviders(<AboutScreen />);

    expect(getByText("About")).toBeTruthy();
    expect(getByText("Disclaimer")).toBeTruthy();
    expect(
      getByText(
        /not affiliated with, endorsed by or sponsored by any of the brands/,
      ),
    ).toBeTruthy();
  });

  it("navigates back when close button is pressed", async () => {
    const { getByLabelText } = await renderWithProviders(<AboutScreen />);

    await press(getByLabelText("Close"));

    expect(expoRouterMocks.back).toHaveBeenCalled();
  });
});
