import { describe, expect, it } from "bun:test";

import {
  getPasswordPolicyFailure,
  getPasswordPolicyRequirementStatus,
  isPasswordPolicyRequirementMet,
} from "./password-policy";

describe("[Unit] password-policy", () => {
  it("accepts a password that meets all rules", () => {
    expect(getPasswordPolicyFailure("ValidPass123")).toBeNull();
  });

  it("rejects passwords that are too short", () => {
    expect(getPasswordPolicyFailure("Short1A")).toBe("too_short");
  });

  it("reports requirement status for each rule", () => {
    expect(
      getPasswordPolicyRequirementStatus("ValidPass123").every((r) => r.met),
    ).toBe(true);
    expect(isPasswordPolicyRequirementMet("abc", "missing_uppercase")).toBe(
      false,
    );
  });
});
