import { describe, expect, it } from "bun:test";

import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { DataLoadStatus } from "./DataLoadStatus";

describe("DataLoadStatus", () => {
  it("renders error message when error is set", () => {
    const { getByText, queryByText } = render(
      <DataLoadStatus
        error="Network failed"
        loaded={false}
        loadingLabel="Loading…"
      >
        <Text>Content</Text>
      </DataLoadStatus>,
    );

    expect(getByText("Network failed")).toBeTruthy();
    expect(queryByText("Content")).toBeNull();
  });

  it("renders loading label while not loaded", () => {
    const { getByText, queryByText } = render(
      <DataLoadStatus error={null} loaded={false} loadingLabel="Loading cards…">
        <Text>Content</Text>
      </DataLoadStatus>,
    );

    expect(getByText("Loading cards…")).toBeTruthy();
    expect(queryByText("Content")).toBeNull();
  });

  it("renders children when loaded without error", () => {
    const { getByText, queryByText } = render(
      <DataLoadStatus error={null} loaded loadingLabel="Loading…">
        <Text>Content</Text>
      </DataLoadStatus>,
    );

    expect(getByText("Content")).toBeTruthy();
    expect(queryByText("Loading…")).toBeNull();
  });
});
