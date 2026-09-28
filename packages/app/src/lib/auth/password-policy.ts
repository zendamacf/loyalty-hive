/** Keep in sync with `packages/api/src/common/password-policy.ts`. */
export const PASSWORD_MIN_LENGTH = 12;

export type PasswordPolicyFailure =
  | "too_short"
  | "missing_uppercase"
  | "missing_lowercase"
  | "missing_digit";

export const PASSWORD_POLICY_REQUIREMENT_ORDER: PasswordPolicyFailure[] = [
  "too_short",
  "missing_uppercase",
  "missing_lowercase",
  "missing_digit",
];

export type PasswordPolicyRequirementStatus = {
  id: PasswordPolicyFailure;
  met: boolean;
};

export function isPasswordPolicyRequirementMet(
  password: string,
  requirement: PasswordPolicyFailure,
): boolean {
  switch (requirement) {
    case "too_short":
      return password.length >= PASSWORD_MIN_LENGTH;
    case "missing_uppercase":
      return /[A-Z]/.test(password);
    case "missing_lowercase":
      return /[a-z]/.test(password);
    case "missing_digit":
      return /\d/.test(password);
  }
}

export function getPasswordPolicyRequirementStatus(
  password: string,
): PasswordPolicyRequirementStatus[] {
  return PASSWORD_POLICY_REQUIREMENT_ORDER.map((id) => ({
    id,
    met: isPasswordPolicyRequirementMet(password, id),
  }));
}

export function getPasswordPolicyFailure(
  password: string,
): PasswordPolicyFailure | null {
  for (const id of PASSWORD_POLICY_REQUIREMENT_ORDER) {
    if (!isPasswordPolicyRequirementMet(password, id)) {
      return id;
    }
  }
  return null;
}
