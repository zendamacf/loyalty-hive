import * as Linking from "expo-linking";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { getStoreUrl } from "@/lib/version-check/store-urls";
import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

const icon = require("../../assets/icon.png");

export const ForceUpdateScreen = () => {
  const { t } = useTranslation(I18nNamespace.Common);
  const { theme } = useTheme();
  const storeUrl = getStoreUrl();

  const openStore = () => {
    if (!storeUrl) {
      return;
    }

    void Linking.openURL(storeUrl);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Image
          accessibilityLabel={t("appLogo")}
          source={icon}
          style={styles.logo}
        />
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t("forceUpdate.title")}
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {t("forceUpdate.message")}
        </Text>
        {storeUrl ? (
          <Button title={t("forceUpdate.updateButton")} onPress={openStore} />
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
