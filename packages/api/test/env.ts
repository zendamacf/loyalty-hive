import { readFileSync } from "node:fs";
import { resolve } from "node:path";

process.env.LIB_VERSION ??= JSON.parse(
  readFileSync(resolve(import.meta.dir, "../package.json"), "utf8"),
).version as string;
