import { ChevronRightIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FormGroup } from "@/components/FormGroup";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { icon, radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type ManageRowProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  showDivider?: boolean;
};

const ManageRow = ({
  label,
  onPress,
  disabled = false,
  destructive = false,
  showDivider = false,
}: ManageRowProps) => {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && [styles.rowDivider, { borderTopColor: theme.border }],
        pressed && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      <Text
        style={[
          styles.rowLabel,
          {
            color: destructive ? theme.error : theme.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
      {!destructive ? (
        <ChevronRightIcon color={theme.textSecondary} size={icon.sm} />
      ) : null}
    </Pressable>
  );
};

export type CardManageSectionProps = {
  onDetailsPress: () => void;
  onEditPress: () => void;
  onDeletePress: () => void;
  detailsDisabled?: boolean;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
};

export const CardManageSection = ({
  onDetailsPress,
  onEditPress,
  onDeletePress,
  detailsDisabled = false,
  editDisabled = false,
  deleteDisabled = false,
}: CardManageSectionProps) => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();

  return (
    <FormGroup label={t("manageSectionLabel")} style={styles.section}>
      <View
        style={[
          styles.list,
          {
            borderColor: theme.border,
            backgroundColor: theme.surface,
          },
        ]}
      >
        <ManageRow
          label={t("manageDetails")}
          onPress={onDetailsPress}
          disabled={detailsDisabled}
        />
        <ManageRow
          label={t("editCardSheetTitle")}
          onPress={onEditPress}
          disabled={editDisabled}
          showDivider
        />
        <ManageRow
          label={t("deleteCard")}
          onPress={onDeletePress}
          disabled={deleteDisabled}
          destructive
          showDivider
        />
      </View>
    </FormGroup>
  );
};

const styles = StyleSheet.create({
  section: {
    alignSelf: "stretch",
  },
  list: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  rowDivider: {
    borderTopWidth: 1,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLabel: {
    flex: 1,
    ...typography.body,
  },
});
