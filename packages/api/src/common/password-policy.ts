import z from "zod";

/** Minimum length for new passwords (signup and future reset/change). */
export const PASSWORD_MIN_LENGTH = 12;

export type PasswordPolicyFailure =
  | "too_short"
  | "missing_uppercase"
  | "missing_lowercase"
  | "missing_digit";

const PASSWORD_POLICY_MESSAGES: Record<PasswordPolicyFailure, string> = {
  too_short: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  missing_uppercase: "Password must include an uppercase letter",
  missing_lowercase: "Password must include a lowercase letter",
  missing_digit: "Password must include a number",
};

export function getPasswordPolicyFailure(
  password: string,
): PasswordPolicyFailure | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "too_short";
  }
  if (!/[A-Z]/.test(password)) {
    return "missing_uppercase";
  }
  if (!/[a-z]/.test(password)) {
    return "missing_lowercase";
  }
  if (!/\d/.test(password)) {
    return "missing_digit";
  }
  return null;
}

export function passwordPolicyMessage(failure: PasswordPolicyFailure): string {
  return PASSWORD_POLICY_MESSAGES[failure];
}

/** Login accepts any non-empty password so existing accounts are not locked out. */
export const loginPasswordSchema = z.string().min(1, "Password is required");

/**
 * Signup (and future password change/reset) enforces {@link PASSWORD_MIN_LENGTH}
 * and a mix of uppercase, lowercase, and digit characters.
 */
export const signupPasswordSchema = z.string().superRefine((password, ctx) => {
  const failure = getPasswordPolicyFailure(password);
  if (failure) {
    ctx.addIssue({
      code: "custom",
      message: passwordPolicyMessage(failure),
    });
  }
});
