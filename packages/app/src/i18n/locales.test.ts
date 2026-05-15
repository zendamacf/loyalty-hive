import { describe, expect, it } from "bun:test";
import { join } from "node:path";

import {
  collectUsedTranslationKeys,
  compareLocaleParity,
  loadEnglishTranslationKeys,
} from "./localeKeys";

const SRC_ROOT = join(import.meta.dir, "..");

describe("locale files", () => {
  it("have identical keys in every namespace across supported locales", () => {
    const mismatches = compareLocaleParity();
    expect(mismatches).toEqual([]);
  });
});

describe("translation key usage", () => {
  it("does not define unused keys in locale JSON", () => {
    const defined = loadEnglishTranslationKeys();
    const used = collectUsedTranslationKeys(SRC_ROOT);

    const unused = [...defined].filter((key) => !used.has(key)).sort();
    expect(unused).toEqual([]);
  });

  it("does not reference keys missing from locale JSON", () => {
    const defined = loadEnglishTranslationKeys();
    const used = collectUsedTranslationKeys(SRC_ROOT);

    const missing = [...used].filter((key) => !defined.has(key)).sort();
    expect(missing).toEqual([]);
  });
});
