import { afterEach, describe, expect, it, mock } from "bun:test";
import { act } from "@testing-library/react-native";
import i18n from "@/i18n";
import { renderWithTheme } from "../../test/render";

/** Bun otherwise executes the real PNG file when LoginScreen loads `require(...)`. */
mock.module("../../assets/images/icon.png", () => ({ default: 1 }));

const { LoginScreen } = await import("./LoginScreen");

async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  });
}

describe("LoginScreen i18n", () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders Spanish copy when locale is es", async () => {
    await act(async () => {
      await i18n.changeLanguage("es");
    });

    const { findByText } = await renderWithTheme(<LoginScreen />);
    await flushMicrotasks();

    expect(await findByText("Iniciar sesión")).toBeTruthy();
    expect(
      await findByText("Inicia sesión para gestionar tus tarjetas de fidelidad"),
    ).toBeTruthy();
  });
});
