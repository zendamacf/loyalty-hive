import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrightnessAsync, setBrightnessAsync } from "expo-brightness";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { CardCodeDisplay } from "@/components/CardCodeDisplay";
import { CardManageSection } from "@/components/CardManageSection";
import { CloseButton } from "@/components/CloseButton";
import { LoyaltyBrandMark } from "@/components/LoyaltyBrandMark";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import {
  CARD_CODE_FROM_CARDS_PARAM,
  CARD_CODE_FROM_CARDS_VALUE,
} from "@/constants/routes.constants";
import {
  getApiV1CardsQueryKey,
  postApiV1CardsByIdViewMutation,
} from "@/lib/api-client";
import { resolveCardHeadings } from "@/lib/cardHeadings";
import { type CardView, resolveCardView } from "@/lib/cardView";
import {
  showCardDetailsSheet,
  showDeleteCardSheet,
  showEditCardSheet,
} from "@/sheets";
import { brandMark, spacing } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const CardCodeScreen = () => {
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
  const createdAt =
    typeof params.createdAt === "string" ? params.createdAt : "";
  const [label, setLabel] = useState(() =>
    typeof params.label === "string" && params.label.trim() ? params.label : "",
  );
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

  useEffect(() => {
    setLabel(typeof params.label === "string" ? params.label : "");
    setDisplayView(
      resolveCardView(
        typeof params.view === "string" ? params.view : undefined,
      ),
    );
  }, [params.label, params.view]);

  const { title: displayName, subtitle } = useMemo(
    () => resolveCardHeadings(brandName, label),
    [brandName, label],
  );

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

  const manageDisabled = !cardId;

  return (
    <ScreenShell>
      <ScreenHeader
        title={displayName}
        subtitle={subtitle}
        subtitlePlacement="withTitle"
        actions={<CloseButton />}
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
                cardId,
                label,
                defaultView: displayView,
                brandName,
                activeSegmentColor: brandBackgroundColor,
              }).then((updated) => {
                if (!updated) {
                  return;
                }
                setLabel(updated.label);
                setDisplayView(updated.view);
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
