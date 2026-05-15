import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { CopyIcon, XIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CardCodeDisplay } from "@/components/CardCodeDisplay";
import { CardCodeViewToggle } from "@/components/CardCodeViewToggle";
import { LoyaltyBrandMark } from "@/components/LoyaltyBrandMark";
import { type CardView, resolveCardView } from "@/lib/cardView";
import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

const HEADER_ICON_SIZE = 24;
const FOOTER_ICON_SIZE = 24;
const BRAND_MARK_HEIGHT_BARCODE = 200;
const BRAND_MARK_HEIGHT_QR = 100;

export const CardCodeScreen = () => {
  const { t } = useTranslation("cards");
  const { t: tCommon } = useTranslation("common");
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
        <Pressable
          accessibilityLabel={tCommon("close")}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
          onPress={() => router.back()}
        >
          <XIcon color={colors.textPrimary} size={HEADER_ICON_SIZE} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <LoyaltyBrandMark
          animateHeight
          brand={brandName}
          logo={logoUrl}
          backgroundColor={brandBackgroundColor}
          height={
            displayView === "2D"
              ? BRAND_MARK_HEIGHT_QR
              : BRAND_MARK_HEIGHT_BARCODE
          }
          style={styles.brandMark}
        />

        <CardCodeDisplay
          cardNumber={cardNumber}
          view={displayView}
          borderColor={colors.border}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
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
            <CopyIcon color={colors.textSecondary} size={FOOTER_ICON_SIZE} />
          </Pressable>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: spacing.sm,
  },
  closeButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.55,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
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
  cardNumber: {
    ...typography.body,
    flex: 1,
  },
  footerIconButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  footerIconButtonPressed: {
    opacity: 0.55,
  },
});
