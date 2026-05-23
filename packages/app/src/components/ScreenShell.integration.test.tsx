import { describe, expect, it } from "bun:test";
import { Text } from "react-native";

import { renderWithProviders } from "../../test/render";

import { ScreenShell } from "./ScreenShell";

describe("[Integration] ScreenShell", () => {
  it("renders children", async () => {
    const { getByText } = await renderWithProviders(
      <ScreenShell>
        <Text>Main content</Text>
      </ScreenShell>,
    );

    expect(getByText("Main content")).toBeTruthy();
  });

  it("renders footer content", async () => {
    const { getByText } = await renderWithProviders(
      <ScreenShell footer={<Text>Footer action</Text>}>
        <Text>Main content</Text>
      </ScreenShell>,
    );

    expect(getByText("Main content")).toBeTruthy();
    expect(getByText("Footer action")).toBeTruthy();
  });

  it("renders ScreenShell.Body children", async () => {
    const { getByText } = await renderWithProviders(
      <ScreenShell>
        <ScreenShell.Body>
          <Text>Body content</Text>
        </ScreenShell.Body>
      </ScreenShell>,
    );

    expect(getByText("Body content")).toBeTruthy();
  });
});
