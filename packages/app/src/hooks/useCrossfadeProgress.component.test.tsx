import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { CROSSFADE_MS, useCrossfadeProgress } from "./useCrossfadeProgress";

function CrossfadeProbe({
  active,
  includeIconTransform = true,
}: {
  active: boolean;
  includeIconTransform?: boolean;
}) {
  const { opacityOff, opacityOn, iconTransform } = useCrossfadeProgress(
    active,
    { includeIconTransform },
  );

  return (
    <>
      <Text testID="opacity-off">{String(opacityOff)}</Text>
      <Text testID="opacity-on">{String(opacityOn)}</Text>
      <Text testID="icon-transform">
        {iconTransform === undefined ? "none" : "present"}
      </Text>
    </>
  );
}

describe("[Component] useCrossfadeProgress", () => {
  it("exports CROSSFADE_MS as 220", () => {
    expect(CROSSFADE_MS).toBe(220);
  });

  it("crossfades off layer visible when active is false", () => {
    const { getByTestId } = render(<CrossfadeProbe active={false} />);

    expect(getByTestId("opacity-off").props.children).toBe("1");
    expect(getByTestId("opacity-on").props.children).toBe("0");
  });

  it("crossfades on layer visible when active is true", () => {
    const { getByTestId } = render(<CrossfadeProbe active={true} />);

    expect(getByTestId("opacity-off").props.children).toBe("0");
    expect(getByTestId("opacity-on").props.children).toBe("1");
  });

  it("omits iconTransform when includeIconTransform is false", () => {
    const { getByTestId } = render(
      <CrossfadeProbe active={false} includeIconTransform={false} />,
    );

    expect(getByTestId("icon-transform").props.children).toBe("none");
  });

  it("includes iconTransform by default", () => {
    const { getByTestId } = render(<CrossfadeProbe active={false} />);

    expect(getByTestId("icon-transform").props.children).toBe("present");
  });
});
