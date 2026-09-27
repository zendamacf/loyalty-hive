import { describe, expect, it } from "bun:test";
import { resolveExposeOpenApi } from "./expose-openapi";

describe("[Unit] resolveExposeOpenApi", () => {
  it("exposes docs outside production by default", () => {
    expect(resolveExposeOpenApi("development", undefined)).toBe(true);
    expect(resolveExposeOpenApi("test", undefined)).toBe(true);
  });

  it("hides docs in production by default", () => {
    expect(resolveExposeOpenApi("production", undefined)).toBe(false);
  });

  it("honors EXPOSE_OPENAPI=false in any environment", () => {
    expect(resolveExposeOpenApi("development", "false")).toBe(false);
    expect(resolveExposeOpenApi("production", "false")).toBe(false);
  });

  it("honors EXPOSE_OPENAPI=true in production", () => {
    expect(resolveExposeOpenApi("production", "true")).toBe(true);
  });
});
