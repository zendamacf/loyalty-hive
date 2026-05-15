import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { CopyIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CardCodeDisplay } from "@/components/CardCodeDisplay";
import { CardCodeViewToggle } from "@/components/CardCodeViewToggle";
import { CloseButton } from "@/components/CloseButton";
import { LoyaltyBrandMark } from "@/components/LoyaltyBrandMark";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { type CardView, resolveCardView } from "@/lib/cardView";
import { brandMark, icon, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const CardCodeScreen = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    cardNumber?: string;
    view?: string;
    title?: string;
    logoUrl?: string;
    backgroundColor?: string;
  }>();

  const cardNumber =
    typeof params.cardNumber === "string" ? params.cardNumber : "";
  const brandName =
    typeof params.title === "string" && params.title.trim()
      ? params.title
      : cardNumber;
  const logoUrl =
    typeof params.logoUrl === "string" && params.logoUrl.trim()
      ? params.logoUrl
      : undefined;
  const brandBackgroundColor =
    typeof params.backgroundColor === "string" && params.backgroundColor.trim()
      ? params.backgroundColor
      : undefined;
  const initialView = resolveCardView(
    typeof params.view === "string" ? params.view : undefined,
  );
  const [displayView, setDisplayView] = useState<CardView>(initialView);

  const toggleDisplayView = useCallback(() => {
    setDisplayView((current) => (current === "1D" ? "2D" : "1D"));
  }, []);

  const copyCardNumber = useCallback(() => {
    if (cardNumber) {
      void Clipboard.setStringAsync(cardNumber);
    }
  }, [cardNumber]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          accessibilityRole="header"
        >
          {brandName}
        </Text>
        <CloseButton />
      </View>

      <View style={styles.content}>
        <LoyaltyBrandMark
          animateHeight
          brand={brandName}
          logo={logoUrl}
          backgroundColor={brandBackgroundColor}
          height={
            displayView === "2D"
              ? brandMark.heightDetailQr
              : brandMark.heightDetailBarcode
          }
          style={styles.brandMark}
          topCardHalf
        />

        <CardCodeDisplay
          cardNumber={cardNumber}
          view={displayView}
          bottomCardHalf
          borderColor={colors.border}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.cardNumberContainer}>
            <Text
              style={[styles.cardNumber, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {cardNumber}
            </Text>
            <Pressable
              accessibilityLabel={t("copyCardNumberA11y")}
              accessibilityRole="button"
              disabled={!cardNumber}
              hitSlop={12}
              style={({ pressed }) => [
                styles.footerIconButton,
                pressed && styles.footerIconButtonPressed,
              ]}
              onPress={copyCardNumber}
            >
              <CopyIcon color={colors.textSecondary} size={icon.md} />
            </Pressable>
          </View>
          <CardCodeViewToggle view={displayView} onToggle={toggleDisplayView} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingBottom: spacing.md,
  },
  brandMark: {
    alignSelf: "stretch",
    maxWidth: 320,
  },
  footerRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardNumberContainer: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
  },
  cardNumber: {
    ...typography.body,
  },
  footerIconButton: {
    width: icon.md,
    height: icon.md,
    alignItems: "center",
    justifyContent: "center",
  },
  footerIconButtonPressed: {
    opacity: 0.55,
  },
});
