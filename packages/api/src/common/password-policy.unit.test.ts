import { describe, expect, it } from "bun:test";

import {
  getPasswordPolicyFailure,
  PASSWORD_MIN_LENGTH,
  passwordPolicyMessage,
  signupPasswordSchema,
} from "./password-policy";

describe("[Unit] password-policy", () => {
  describe("getPasswordPolicyFailure", () => {
    it("accepts a password that meets all rules", () => {
      expect(getPasswordPolicyFailure("ValidPass123")).toBeNull();
    });

    it("rejects passwords shorter than the minimum length", () => {
      expect(getPasswordPolicyFailure("Short1A")).toBe("too_short");
    });

    it("rejects passwords missing an uppercase letter", () => {
      expect(getPasswordPolicyFailure("validpass123")).toBe(
        "missing_uppercase",
      );
    });

    it("rejects passwords missing a lowercase letter", () => {
      expect(getPasswordPolicyFailure("VALIDPASS123")).toBe(
        "missing_lowercase",
      );
    });

    it("rejects passwords missing a digit", () => {
      expect(getPasswordPolicyFailure("ValidPassword")).toBe("missing_digit");
    });
  });

  describe("passwordPolicyMessage", () => {
    it("includes the minimum length in the too_short message", () => {
      expect(passwordPolicyMessage("too_short")).toContain(
        String(PASSWORD_MIN_LENGTH),
      );
    });
  });

  describe("signupPasswordSchema", () => {
    it("parses a compliant password", () => {
      const result = signupPasswordSchema.safeParse("ValidPass123");
      expect(result.success).toBe(true);
    });

    it("fails with a clear message for policy violations", () => {
      const result = signupPasswordSchema.safeParse("weak");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          passwordPolicyMessage("too_short"),
        );
      }
    });
  });
});
