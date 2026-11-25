import Constants, { ExecutionEnvironment } from "expo-constants";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTitle } from "@/components/AppTitle";
import { CloseButton } from "@/components/CloseButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { APP_NAME } from "@/constants/branding.constants";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { useTrackScreenView } from "@/lib/analytics";
import { getAppVersion } from "@/lib/app-version";
import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

/// react-native-legal looks up its native module on import, which throws in
/// Expo Go because the module is not in that binary. Load it only elsewhere.
const getReactNativeLegal = () =>
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? null
    : (require("react-native-legal") as typeof import("react-native-legal"))
        .ReactNativeLegal;

export const AboutScreen = () => {
  const { t } = useTranslation(I18nNamespace.About);
  const { theme } = useTheme();
  const reactNativeLegal = getReactNativeLegal();
  useTrackScreenView(Routes.ABOUT, { title: "About Screen" });

  return (
    <ScreenShell>
      <ScreenShell.Body>
        <ScreenHeader title={t("title")} actions={<CloseButton />} embedded />

        <View style={styles.section}>
          <AppTitle align="left" />
          <Text style={[typography.caption, { color: theme.textSecondary }]}>
            {t("version", { version: getAppVersion() })}
          </Text>
          <Text style={[typography.body, { color: theme.textPrimary }]}>
            {t("description")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, { color: theme.textSecondary }]}>
            {t("disclaimerHeading")}
          </Text>
          <Text style={[typography.body, { color: theme.textPrimary }]}>
            {t("disclaimer", { appName: APP_NAME })}
          </Text>
        </View>

        {reactNativeLegal && (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t("licenses")}
            style={styles.section}
            onPress={() =>
              reactNativeLegal.launchLicenseListScreen(t("licenses"))
            }
          >
            <Text style={[typography.link, { color: theme.textPrimary }]}>
              {t("licenses")}
            </Text>
          </Pressable>
        )}
      </ScreenShell.Body>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
