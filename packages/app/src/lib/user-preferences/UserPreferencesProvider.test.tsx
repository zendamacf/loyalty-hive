import { beforeEach, describe, expect, it } from "bun:test";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  act,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/i18n.constants";
import { useLanguage } from "@/i18n/language-context";
import { CARD_SORT_STORAGE_KEY, useCardSort } from "@/lib/card-sort";
import { THEME_STORAGE_KEY } from "@/theme/theme.constants";
import { useTheme } from "@/theme/useTheme";
import { UserPreferencesProvider } from "./UserPreferencesProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <UserPreferencesProvider>{children}</UserPreferencesProvider>
);

function ThemeProbe() {
  const { colorAppearance, setThemeMode } = useTheme();
  return (
    <>
      <Text>{colorAppearance}</Text>
      <Text
        accessibilityLabel="Set dark theme"
        onPress={() => setThemeMode("dark")}
      />
    </>
  );
}

describe("UserPreferencesProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
    await AsyncStorage.removeItem(CARD_SORT_STORAGE_KEY);
  });

  it("ignores invalid stored theme and resets to system preference", async () => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, "invalid");

    const { getByText } = render(
      <UserPreferencesProvider>
        <ThemeProbe />
      </UserPreferencesProvider>,
    );

    await waitFor(() => expect(getByText("light")).toBeTruthy());
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("persists system theme preference across remounts", async () => {
    const first = render(
      <UserPreferencesProvider>
        <ThemeProbe />
      </UserPreferencesProvider>,
    );

    await waitFor(() => expect(first.getByText("light")).toBeTruthy());
    first.unmount();

    const second = render(
      <UserPreferencesProvider>
        <ThemeProbe />
      </UserPreferencesProvider>,
    );

    await waitFor(() => expect(second.getByText("light")).toBeTruthy());
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("persists theme preference across remounts", async () => {
    const first = render(
      <UserPreferencesProvider>
        <ThemeProbe />
      </UserPreferencesProvider>,
    );

    await waitFor(() => expect(first.getByText("light")).toBeTruthy());

    fireEvent.press(first.getByLabelText("Set dark theme"));

    await waitFor(() => expect(first.getByText("dark")).toBeTruthy());
    first.unmount();

    const second = render(
      <UserPreferencesProvider>
        <ThemeProbe />
      </UserPreferencesProvider>,
    );

    await waitFor(() => expect(second.getByText("dark")).toBeTruthy());
  });

  it("loads a stored card sort preference", async () => {
    await AsyncStorage.setItem(CARD_SORT_STORAGE_KEY, "most_viewed");

    const { result } = renderHook(() => useCardSort(), { wrapper });

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });
    expect(result.current.sort).toBe("most_viewed");
  });

  it("persists card sort changes", async () => {
    const { result } = renderHook(() => useCardSort(), { wrapper });

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.setSort("last_viewed");
    });

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(CARD_SORT_STORAGE_KEY)).toBe(
        "last_viewed",
      );
    });
  });

  it("loads a stored language preference", async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "es");

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });
    expect(result.current.preference).toBe("es");
  });
});
