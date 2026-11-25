import { describe, expect, it } from "bun:test";
import { join } from "node:path";

type AppTheme = Record<string, string>;

/** Reads the custom properties of the first block that starts at `selector`. */
function cssVariables(css: string, marker: string): Record<string, string> {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`${marker} not found`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      (value ?? "").trim().toLowerCase(),
    ]),
  );
}

async function loadAppThemes() {
  // Path in a variable, so tsc does not type check the React Native app.
  const path = join(import.meta.dir, "../../app/src/theme/themes.ts");
  const { lightTheme, darkTheme } = (await import(path)) as {
    lightTheme: AppTheme;
    darkTheme: AppTheme;
  };
  return { lightTheme, darkTheme };
}

const TOKENS = [
  ["background", "background"],
  ["surface", "surface"],
  ["text-primary", "textPrimary"],
  ["text-secondary", "textSecondary"],
  ["border", "border"],
  ["primary", "primary"],
  ["error", "error"],
  ["success", "success"],
] as const;

describe("[Unit] admin theme colors", () => {
  it("match the app light and dark themes", async () => {
    const css = await Bun.file(join(import.meta.dir, "styles.css")).text();
    const light = cssVariables(css, ":root {");
    const dark = {
      ...light,
      ...cssVariables(css, "@media (prefers-color-scheme: dark)"),
    };
    const { lightTheme, darkTheme } = await loadAppThemes();

    for (const [cssName, themeKey] of TOKENS) {
      expect({ [cssName]: light[cssName] }).toEqual({
        [cssName]: lightTheme[themeKey]?.toLowerCase(),
      });
      expect({ [cssName]: dark[cssName] }).toEqual({
        [cssName]: darkTheme[themeKey]?.toLowerCase(),
      });
    }
  });
});
