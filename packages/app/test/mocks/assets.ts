import { mock } from "bun:test";

/** Stub value returned for mocked image requires. */
export const imageStub = { default: 1 };

/**
 * Bun executes real asset files on `require()` unless the exact import string is mocked.
 * Register every path variant used in app and test sources.
 */
const imageRequirePaths = [
  "../assets/icon.png",
  "../../assets/icon.png",
  "../assets/icon-transparent.png",
  "../../assets/icon-transparent.png",
] as const;

for (const path of imageRequirePaths) {
  mock.module(path, () => imageStub);
}
