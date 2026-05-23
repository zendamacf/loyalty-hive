import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrightnessAsync, setBrightnessAsync } from "expo-brightness";
import { router, useLocalSearchParams } from "expo-router";
import { EllipsisVerticalIcon } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { CardCodeDisplay } from "@/components/CardCodeDisplay";
import { CardManageSection } from "@/components/CardManageSection";
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
import {
  showCardDetailsSheet,
  showDeleteCardSheet,
  showEditCardSheet,
} from "@/sheets";
import { brandMark, icon, spacing } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const CardCodeScreen = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
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

  useFocusEffect(
    useCallback(() => {
      let initialBrightness: number | null = null;
      let active = true;

      void getBrightnessAsync().then((level) => {
        initialBrightness = level;
        if (active) {
          void setBrightnessAsync(1);
        } else {
          void setBrightnessAsync(level);
        }
      });

      return () => {
        active = false;
        if (initialBrightness !== null) {
          void setBrightnessAsync(initialBrightness);
        }
      };
    }, []),
  );

  useEffect(() => {
    if (!fromCards || !cardId) {
      return;
    }
    logCardView({ path: { id: cardId } });
  }, [cardId, fromCards, logCardView]);

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

  const manageDisabled = !cardId;

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
              <EllipsisVerticalIcon color={theme.textPrimary} size={icon.md} />
            </Pressable>
            <CloseButton />
          </>
        }
      />

      <View style={styles.content}>
        <View style={styles.cardColumn}>
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
            borderColor={theme.border}
          />

          <CardManageSection
            onDetailsPress={() => {
              void showCardDetailsSheet({ cardNumber, createdAt });
            }}
            onEditPress={() => {
              void showEditCardSheet({
                label,
                defaultView: initialView,
                activeSegmentColor: brandBackgroundColor,
              });
            }}
            onDeletePress={() => {
              void showDeleteCardSheet({ cardId });
            }}
            detailsDisabled={manageDisabled}
            editDisabled={manageDisabled}
            deleteDisabled={manageDisabled}
          />
        </View>
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
    alignSelf: "stretch",
  },
  cardColumn: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  brandMark: {
    alignSelf: "stretch",
  },
});
