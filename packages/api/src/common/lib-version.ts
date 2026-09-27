import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readPackageVersion(): string {
  try {
    const packageJsonPath = resolve(import.meta.dir, "../../package.json");
    const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      version: string;
    };
    return version;
  } catch {
    return "0.0.0";
  }
}
