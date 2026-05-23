import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ArrowDownAZIcon,
  ClockIcon,
  EyeIcon,
  ListFilterIcon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DataLoadStatus } from "@/components/DataLoadStatus";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { Select } from "@/components/Select";
import {
  CARD_CODE_FROM_CARDS_PARAM,
  CARD_CODE_FROM_CARDS_VALUE,
  Routes,
} from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  type GetApiV1CardsResponse,
  getApiV1CardsOptions,
} from "@/lib/api-client";
import {
  CARD_SORT_OPTIONS,
  type CardListSort,
  useCardSort,
} from "@/lib/card-sort";
import { resolveCardHeadings } from "@/lib/cardHeadings";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { AppTitle } from "../components/AppTitle";
import { LoyaltyBrandLogo } from "../components/LoyaltyBrandLogo";
import { SearchBar } from "../components/SearchBar";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useThemedRefreshControl } from "../hooks/useThemedRefreshControl";
import { brandMark, icon, radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

const appIcon = require("../../assets/icon.png");

const SORT_LABEL_KEYS: Record<
  CardListSort,
  "sortAlphabetical" | "sortMostViewed" | "sortLastViewed"
> = {
  alphabetical: "sortAlphabetical",
  most_viewed: "sortMostViewed",
  last_viewed: "sortLastViewed",
} as const;

const SORT_ICONS = {
  alphabetical: ArrowDownAZIcon,
  most_viewed: EyeIcon,
  last_viewed: ClockIcon,
} as const;

function filterCards(
  list: GetApiV1CardsResponse,
  query: string,
): GetApiV1CardsResponse {
  const q = query.trim().toLowerCase();
  if (!q) {
    return list;
  }
  return list.filter((item) => {
    const label = (item.label ?? "").toLowerCase();
    const brand = (item.brand?.name ?? "").toLowerCase();
    const num = item.cardNumber.toLowerCase();
    return label.includes(q) || brand.includes(q) || num.includes(q);
  });
}

export const CardsScreen = () => {
  const { t } = useTranslation([I18nNamespace.Cards, I18nNamespace.Common]);
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const { sort, setSort, hydrated: cardSortHydrated } = useCardSort();

  const {
    data: cards = [],
    error: queryError,
    isError,
    isPending,
    refetch,
  } = useQuery({
    ...getApiV1CardsOptions({
      query: { sort },
    }),
    enabled: cardSortHydrated,
  });

  const error = isError ? getErrorMessage(queryError) : null;
  const loaded = !isPending;

  const filteredCards = useMemo(
    () => filterCards(cards, searchQuery),
    [cards, searchQuery],
  );

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refetch();
  });
  const refreshControl = useThemedRefreshControl(refreshing, onRefresh);

  const sortOptions = useMemo(
    () =>
      CARD_SORT_OPTIONS.map((option) => ({
        value: option,
        label: t(SORT_LABEL_KEYS[option]),
        icon: SORT_ICONS[option],
      })),
    [t],
  );

  let emptyTitle: string | null = null;
  let emptySubtitle: string | null = null;
  if (loaded && !error) {
    if (cards.length === 0) {
      emptyTitle = t("noCardsTitle");
      emptySubtitle = t("noCardsSubtitle");
    } else if (filteredCards.length === 0 && searchQuery.trim()) {
      emptyTitle = t("noMatchingTitle");
      emptySubtitle = t("noMatchingSubtitle");
    }
  }

  const listEmpty =
    emptyTitle && emptySubtitle ? (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          {emptyTitle}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          {emptySubtitle}
        </Text>
      </View>
    ) : null;

  return (
    <ScreenShell edges={["top", "left", "right"]} style={styles.container}>
      <ScreenHeader
        style={styles.header}
        actions={
          <>
            <Pressable
              accessibilityLabel={t("addCardA11y")}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
              onPress={() => router.push(Routes.SELECT_BRAND)}
            >
              <PlusIcon color={theme.textPrimary} size={icon.md} />
            </Pressable>
            <Pressable
              accessibilityLabel={t("openSettingsA11y")}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
              onPress={() => router.push(Routes.SETTINGS)}
            >
              <SettingsIcon color={theme.textPrimary} size={icon.md} />
            </Pressable>
          </>
        }
      >
        <View style={styles.headerMain}>
          <Image
            accessibilityLabel={t("appLogo", { ns: I18nNamespace.Common })}
            source={appIcon}
            style={styles.logo}
          />
          <View style={styles.titleWrap}>
            <AppTitle align="left" />
          </View>
        </View>
      </ScreenHeader>

      <View style={styles.searchRow}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("searchPlaceholder")}
          style={styles.searchBar}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Select
          value={sort}
          onValueChange={setSort}
          options={sortOptions}
          accessibilityLabel={t("sortLabel")}
          menuMinWidth={200}
          renderTrigger={({
            open: sortOpen,
            onPress,
            disabled,
            accessibilityLabel: sortA11yLabel,
            selectedLabel,
          }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={sortA11yLabel}
              accessibilityState={{ disabled, expanded: sortOpen }}
              accessibilityValue={{ text: selectedLabel }}
              disabled={disabled}
              hitSlop={8}
              onPress={onPress}
              style={({ pressed }) => [
                pressed && !disabled && styles.sortButtonPressed,
              ]}
            >
              <ListFilterIcon color={theme.textPrimary} size={icon.md} />
            </Pressable>
          )}
        />
      </View>

      <DataLoadStatus error={error} loaded={loaded} loadingLabel={t("loading")}>
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={
            filteredCards.length === 0
              ? styles.listContentEmpty
              : styles.listContent
          }
          ListEmptyComponent={listEmpty}
          refreshControl={refreshControl}
          renderItem={({ item }) => {
            const cardBackgroundColor =
              item.brand?.backgroundColor ?? theme.cardFallback;
            const brandName = item.brand?.name ?? "";
            const label = item.label ?? "";
            const { title, subtitle } = resolveCardHeadings(brandName, label);
            const markBrand =
              brandName.trim() || label.trim() || item.cardNumber;
            const cardA11yLabel = subtitle ? `${title}, ${subtitle}` : title;

            return (
              <View style={styles.card}>
                <View
                  style={[styles.cardTile, { height: brandMark.heightList }]}
                >
                  <LoyaltyBrandLogo
                    brand={markBrand}
                    accessibilityLabel={cardA11yLabel}
                    logo={item.brand?.logoUrl}
                    backgroundColor={cardBackgroundColor}
                    height={brandMark.heightList}
                    onPress={() =>
                      router.push({
                        pathname: Routes.CARD_CODE,
                        params: {
                          id: item.id,
                          cardNumber: item.cardNumber,
                          view: item.view ?? "1D",
                          title,
                          brandName,
                          label,
                          createdAt: item.createdAt,
                          logoUrl: item.brand?.logoUrl ?? "",
                          backgroundColor: cardBackgroundColor,
                          [CARD_CODE_FROM_CARDS_PARAM]:
                            CARD_CODE_FROM_CARDS_VALUE,
                        },
                      })
                    }
                  />
                  {subtitle ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.labelBar,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.labelBarText,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {subtitle}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      </DataLoadStatus>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  headerButton: {
    height: 56,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonPressed: {
    opacity: 0.55,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  titleWrap: {
    height: 56,
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    marginBottom: 0,
  },
  sortButtonPressed: {
    opacity: 0.85,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  card: {
    flex: 0.5,
  },
  cardTile: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: radius.sm,
  },
  labelBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    borderCurve: "continuous",
  },
  labelBarText: {
    ...typography.caption,
    fontWeight: typography.bodySemibold.fontWeight,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    ...typography.heading,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.subtitle,
    textAlign: "center",
    lineHeight: 22,
  },
});
