import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const clientGenPath = path.join(import.meta.dirname, "gen/client.gen.ts");

describe("[Unit] api-client codegen output", () => {
  it("imports runtime config without a .ts extension or ts-expect-error hotfix", () => {
    const source = readFileSync(clientGenPath, "utf8");

    expect(source).not.toMatch(/@ts-expect-error.*runtimeConfigPath/);
    expect(source).not.toMatch(/from ['"]\.\.\/setup\.ts['"]/);
    expect(source).toMatch(/from ['"]\.\.\/setup['"]/);
  });
});
