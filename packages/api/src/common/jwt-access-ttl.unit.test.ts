import { describe, expect, it } from "bun:test";

import {
  DEFAULT_JWT_ACCESS_TTL,
  parseJwtAccessTtlSeconds,
} from "./jwt-access-ttl";

const SECONDS_PER_DAY = 24 * 60 * 60;

describe("[Unit] jwt-access-ttl", () => {
  describe("parseJwtAccessTtlSeconds", () => {
    it("parses plain seconds", () => {
      expect(parseJwtAccessTtlSeconds("3600")).toBe(3600);
    });

    it("parses duration suffixes", () => {
      expect(parseJwtAccessTtlSeconds("30s")).toBe(30);
      expect(parseJwtAccessTtlSeconds("15m")).toBe(900);
      expect(parseJwtAccessTtlSeconds("2h")).toBe(7200);
      expect(parseJwtAccessTtlSeconds("7d")).toBe(7 * SECONDS_PER_DAY);
      expect(parseJwtAccessTtlSeconds("30d")).toBe(30 * SECONDS_PER_DAY);
    });

    it("trims surrounding whitespace", () => {
      expect(parseJwtAccessTtlSeconds("  30d  ")).toBe(30 * SECONDS_PER_DAY);
    });

    it("uses the default fallback when value is empty", () => {
      expect(DEFAULT_JWT_ACCESS_TTL).toBe("7d");
      expect(parseJwtAccessTtlSeconds(undefined)).toBe(7 * SECONDS_PER_DAY);
      expect(parseJwtAccessTtlSeconds("")).toBe(7 * SECONDS_PER_DAY);
      expect(parseJwtAccessTtlSeconds("   ")).toBe(7 * SECONDS_PER_DAY);
    });

    it("uses a custom fallback when provided", () => {
      expect(parseJwtAccessTtlSeconds(undefined, "30d")).toBe(
        30 * SECONDS_PER_DAY,
      );
    });

    it("throws for invalid values", () => {
      expect(() => parseJwtAccessTtlSeconds("not-a-ttl")).toThrow(
        /Invalid JWT_ACCESS_TTL/,
      );
      expect(() => parseJwtAccessTtlSeconds("7w")).toThrow(
        /Invalid JWT_ACCESS_TTL/,
      );
    });
  });
});
