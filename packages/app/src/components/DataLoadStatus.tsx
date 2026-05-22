import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export type DataLoadStatusProps = {
  error: string | null;
  loaded: boolean;
  loadingLabel: string;
  children: ReactNode;
};

export const DataLoadStatus = ({
  error,
  loaded,
  loadingLabel,
  children,
}: DataLoadStatusProps) => {
  const { theme } = useTheme();

  if (error) {
    return (
      <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
    );
  }

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.textPrimary} />
        <Text style={[styles.loadingLabel, { color: theme.textSecondary }]}>
          {loadingLabel}
        </Text>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  errorText: {
    marginTop: spacing.sm,
    ...typography.caption,
  },
  loading: {
    marginTop: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingLabel: {
    ...typography.caption,
  },
});
