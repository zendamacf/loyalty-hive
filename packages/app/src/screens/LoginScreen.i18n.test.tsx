import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { act } from "@testing-library/react-native";

import i18n from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/i18n.constants";
import { renderWithTheme } from "../../test/render";

const { LoginScreen } = await import("./LoginScreen");

async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  });
}

describe("LoginScreen i18n", () => {
  beforeEach(async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders Spanish copy when locale is es", async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "es");

    const { findByText } = await renderWithTheme(<LoginScreen />);
    await flushMicrotasks();

    expect(await findByText("Iniciar sesión")).toBeTruthy();
    expect(
      await findByText(
        "Inicia sesión para gestionar tus tarjetas de fidelidad",
      ),
    ).toBeTruthy();
  });
});
