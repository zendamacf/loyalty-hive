import { describe, expect, it } from "bun:test";
import { Text } from "react-native";

import { renderWithTheme } from "../../test/render";

import { ScreenHeader } from "./ScreenHeader";

describe("ScreenHeader", () => {
  it("renders title and actions", () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <ScreenHeader
        title="Settings"
        actions={<Text accessibilityLabel="Close">X</Text>}
        embedded
      />,
    );

    expect(getByText("Settings")).toBeTruthy();
    expect(getByLabelText("Close")).toBeTruthy();
  });

  it("renders subtitle below the title row", () => {
    const { getByText } = renderWithTheme(
      <ScreenHeader
        title="Add card"
        subtitle="Pick a brand"
        subtitleVariant="caption"
        embedded
      />,
    );

    expect(getByText("Add card")).toBeTruthy();
    expect(getByText("Pick a brand")).toBeTruthy();
  });

  it("renders subtitle beside the title when placement is withTitle", () => {
    const { getByText } = renderWithTheme(
      <ScreenHeader
        title="ASOS"
        subtitle="Work card"
        subtitlePlacement="withTitle"
        embedded
      />,
    );

    expect(getByText("ASOS")).toBeTruthy();
    expect(getByText("Work card")).toBeTruthy();
  });

  it("renders custom children instead of title text", () => {
    const { getByText, getByLabelText, queryByText } = renderWithTheme(
      <ScreenHeader actions={<Text accessibilityLabel="Add">+</Text>} embedded>
        <Text>Custom title</Text>
      </ScreenHeader>,
    );

    expect(getByText("Custom title")).toBeTruthy();
    expect(queryByText("Settings")).toBeNull();
    expect(getByLabelText("Add")).toBeTruthy();
  });
});
