import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { EllipsisVerticalIcon } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { CardCodeDisplay } from "@/components/CardCodeDisplay";
import { CardCodeViewToggle } from "@/components/CardCodeViewToggle";
import { CloseButton } from "@/components/CloseButton";
import { LoyaltyBrandMark } from "@/components/LoyaltyBrandMark";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import {
  CARD_CODE_FROM_CARDS_PARAM,
  CARD_CODE_FROM_CARDS_VALUE,
  Routes,
} from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  getApiV1CardsQueryKey,
  postApiV1CardsByIdViewMutation,
} from "@/lib/api-client";
import { type CardView, resolveCardView } from "@/lib/cardView";
import { brandMark, icon, spacing } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const CardCodeScreen = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    cardNumber?: string;
    view?: string;
    title?: string;
    logoUrl?: string;
    backgroundColor?: string;
    brandName?: string;
    label?: string;
    createdAt?: string;
    [CARD_CODE_FROM_CARDS_PARAM]?: string;
  }>();

  const queryClient = useQueryClient();
  const cardId = typeof params.id === "string" ? params.id : "";
  const fromCards =
    params[CARD_CODE_FROM_CARDS_PARAM] === CARD_CODE_FROM_CARDS_VALUE;
  const cardNumber =
    typeof params.cardNumber === "string" ? params.cardNumber : "";
  const brandName =
    typeof params.brandName === "string" ? params.brandName : "";
  const label = typeof params.label === "string" ? params.label : "";
  const createdAt =
    typeof params.createdAt === "string" ? params.createdAt : "";
  const displayName =
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

  const { mutate: logCardView } = useMutation({
    ...postApiV1CardsByIdViewMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getApiV1CardsQueryKey() });
    },
  });

  useEffect(() => {
    if (!fromCards || !cardId) {
      return;
    }
    logCardView({ path: { id: cardId } });
  }, [cardId, fromCards, logCardView]);

  const toggleDisplayView = useCallback(() => {
    setDisplayView((current) => (current === "1D" ? "2D" : "1D"));
  }, []);

  const openCardSettings = useCallback(() => {
    router.push({
      pathname: Routes.CARD_SETTINGS,
      params: {
        id: cardId,
        cardNumber,
        brandName,
        label,
        createdAt,
      },
    });
  }, [brandName, cardId, cardNumber, createdAt, label]);

  return (
    <ScreenShell>
      <ScreenHeader
        title={displayName}
        actions={
          <>
            <Pressable
              accessibilityLabel={t("configureCardA11y")}
              accessibilityRole="button"
              disabled={!cardId}
              hitSlop={12}
              style={({ pressed }) => [
                styles.headerIconButton,
                pressed && styles.headerIconButtonPressed,
              ]}
              onPress={openCardSettings}
            >
              <EllipsisVerticalIcon color={colors.textPrimary} size={icon.md} />
            </Pressable>
            <CloseButton />
          </>
        }
      />

      <View style={styles.content}>
        <LoyaltyBrandMark
          animateHeight
          brand={displayName}
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
        <CardCodeViewToggle
          view={displayView}
          activeSegmentColor={brandBackgroundColor}
          onToggle={toggleDisplayView}
        />
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  headerIconButton: {
    width: icon.md,
    height: icon.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconButtonPressed: {
    opacity: 0.55,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  brandMark: {
    alignSelf: "stretch",
    maxWidth: 320,
  },
});
