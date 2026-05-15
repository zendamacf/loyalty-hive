import { router } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Routes } from "@/constants/routes.constants";
import { client } from "@/lib/api-client";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const SettingsScreen = () => {
  const { colors } = useTheme();

  const signOut = useCallback(() => {
    client.setConfig({ auth: undefined });
    router.replace(Routes.LOGIN);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Settings
        </Text>

        <View
          style={[
            styles.themeRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>
            Theme
          </Text>
          <ThemeToggle showLabel style={styles.themeToggle} />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Sign out" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  themeToggle: {
    padding: 0,
  },
  themeLabel: {
    ...typography.label,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
