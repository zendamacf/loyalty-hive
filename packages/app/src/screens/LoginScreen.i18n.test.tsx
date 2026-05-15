import { afterEach, describe, expect, it, mock } from "bun:test";
import i18n from "@/i18n";
import { renderWithTheme } from "../../test/render";

/** Bun otherwise executes the real PNG file when LoginScreen loads `require(...)`. */
mock.module("../../assets/images/icon.png", () => ({ default: 1 }));

const { LoginScreen } = await import("./LoginScreen");

describe("LoginScreen i18n", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders Spanish copy when locale is es", async () => {
    await i18n.changeLanguage("es");

    const { getByText } = renderWithTheme(<LoginScreen />);

    expect(getByText("Iniciar sesión")).toBeTruthy();
    expect(
      getByText("Inicia sesión para gestionar tus tarjetas de fidelidad"),
    ).toBeTruthy();
  });
});
