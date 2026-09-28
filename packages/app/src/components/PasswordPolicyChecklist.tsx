import { Check, CircleDot } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  getPasswordPolicyRequirementStatus,
  PASSWORD_MIN_LENGTH,
  type PasswordPolicyFailure,
} from "@/lib/auth/password-policy";
import {
  fontWeight,
  icon as iconSize,
  spacing,
  typography,
} from "../theme/theme";
import { useTheme } from "../theme/useTheme";

type PasswordPolicyChecklistProps = {
  password: string;
};

const REQUIREMENT_I18N_KEY: Record<
  PasswordPolicyFailure,
  "minLength" | "uppercase" | "lowercase" | "digit"
> = {
  too_short: "minLength",
  missing_uppercase: "uppercase",
  missing_lowercase: "lowercase",
  missing_digit: "digit",
};

export const PasswordPolicyChecklist = ({
  password,
}: PasswordPolicyChecklistProps) => {
  const { t } = useTranslation(I18nNamespace.Auth);
  const { theme } = useTheme();
  const requirements = getPasswordPolicyRequirementStatus(password);

  return (
    <View
      accessibilityRole="list"
      style={styles.container}
      testID="password-policy-checklist"
    >
      <Text style={[styles.heading, { color: theme.textSecondary }]}>
        {t("passwordRequirementsHeading")}
      </Text>
      {requirements.map(({ id, met }) => {
        const labelKey = REQUIREMENT_I18N_KEY[id];
        const label =
          labelKey === "minLength"
            ? t("passwordRequirement.minLength", {
                count: PASSWORD_MIN_LENGTH,
              })
            : t(`passwordRequirement.${labelKey}`);

        return (
          <View
            key={id}
            accessibilityRole="text"
            accessibilityState={{ checked: met }}
            accessibilityLabel={label}
            style={styles.row}
            testID={`password-requirement-${id}`}
          >
            {met ? (
              <Check color={theme.success} size={iconSize.sm} />
            ) : (
              <CircleDot color={theme.textSecondary} size={iconSize.sm} />
            )}
            <Text
              style={[
                styles.label,
                { color: met ? theme.textPrimary : theme.textSecondary },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  heading: {
    ...typography.caption,
    fontWeight: fontWeight.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    flex: 1,
  },
});
