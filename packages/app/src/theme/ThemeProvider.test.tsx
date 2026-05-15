import { beforeEach, describe, expect, it } from "bun:test";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { renderWithTheme } from "../../test/render";
import { THEME_STORAGE_KEY } from "./theme.constants";
import { useTheme } from "./useTheme";

function ThemeProbe() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <Text
      accessibilityLabel={isDark ? "Use light theme" : "Use dark theme"}
      onPress={toggleTheme}
    >
      {isDark ? "dark" : "light"}
    </Text>
  );
}

describe("ThemeProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem(THEME_STORAGE_KEY);
  });

  it("persists theme preference across remounts", async () => {
    const first = renderWithTheme(<ThemeProbe />);

    await waitFor(() => expect(first.getByText("light")).toBeTruthy());

    fireEvent.press(first.getByLabelText("Use dark theme"));

    await waitFor(() => expect(first.getByText("dark")).toBeTruthy());
    first.unmount();

    const second = renderWithTheme(<ThemeProbe />);

    await waitFor(() => expect(second.getByText("dark")).toBeTruthy());
  });
});
