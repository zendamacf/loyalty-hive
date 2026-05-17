import { describe, expect, it } from "bun:test";
import { Text } from "react-native";

import { renderWithTheme } from "../../test/render";

import { ScreenShell } from "./ScreenShell";

describe("ScreenShell", () => {
  it("renders children", () => {
    const { getByText } = renderWithTheme(
      <ScreenShell>
        <Text>Main content</Text>
      </ScreenShell>,
    );

    expect(getByText("Main content")).toBeTruthy();
  });

  it("renders footer content", () => {
    const { getByText } = renderWithTheme(
      <ScreenShell footer={<Text>Footer action</Text>}>
        <Text>Main content</Text>
      </ScreenShell>,
    );

    expect(getByText("Main content")).toBeTruthy();
    expect(getByText("Footer action")).toBeTruthy();
  });

  it("renders ScreenShell.Body children", () => {
    const { getByText } = renderWithTheme(
      <ScreenShell>
        <ScreenShell.Body>
          <Text>Body content</Text>
        </ScreenShell.Body>
      </ScreenShell>,
    );

    expect(getByText("Body content")).toBeTruthy();
  });
});
