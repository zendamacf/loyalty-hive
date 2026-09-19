import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { PlusIcon } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  type ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CloseButton } from "@/components/CloseButton";
import { DataLoadStatus } from "@/components/DataLoadStatus";
import { LoyaltyBrandLogo } from "@/components/LoyaltyBrandLogo";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { useTrackScreenView } from "@/lib/analytics/use-track-screen-view";
import {
  type GetApiV1BrandsResponse,
  getApiV1BrandsOptions,
} from "@/lib/api-client";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { showRequestBrandSheet } from "@/sheets";
import { SearchBar } from "../components/SearchBar";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useThemedRefreshControl } from "../hooks/useThemedRefreshControl";
import { icon, radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

type Brand = GetApiV1BrandsResponse[number];

export const SelectBrandScreen = () => {
  const { t } = useTranslation(I18nNamespace.Brands);
  const { theme } = useTheme();
  useTrackScreenView(Routes.SELECT_BRAND, { title: "Select Brand Screen" });
  const [query, setQuery] = useState("");

  const {
    data: brands = [],
    error: queryError,
    isError,
    isPending,
    refetch,
  } = useQuery(getApiV1BrandsOptions());

  const error = isError ? getErrorMessage(queryError) : null;
  const loaded = !isPending;

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refetch();
  });
  const refreshControl = useThemedRefreshControl(refreshing, onRefresh);

  const filteredBrands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return brands;
    }

    return brands.filter((brand) =>
      brand.name.toLowerCase().includes(normalizedQuery),
    );
  }, [brands, query]);

  const trimmedQuery = query.trim();
  const showEmptySearchState =
    loaded && !error && trimmedQuery.length >= 2 && filteredBrands.length === 0;

  const openRequestBrandSheet = useCallback(() => {
    void showRequestBrandSheet({ requestedName: trimmedQuery });
  }, [trimmedQuery]);

  const openCustomCardScan = useCallback(() => {
    router.push({
      pathname: Routes.SCAN,
      params: { customCard: "1" },
    });
  }, []);

  const customCardSection = (
    <View style={styles.customFooter}>
      <Pressable
        accessibilityLabel={t("customCardTitle")}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.customCardButton,
          {
            borderColor: theme.border,
            backgroundColor: theme.surface,
          },
          pressed && styles.customCardButtonPressed,
        ]}
        onPress={openCustomCardScan}
      >
        <PlusIcon color={theme.textPrimary} size={icon.md} />
        <Text style={[styles.customCardTitle, { color: theme.textPrimary }]}>
          {t("customCardTitle")}
        </Text>
      </Pressable>
    </View>
  );

  const renderBrand: ListRenderItem<Brand> = useCallback(
    ({ item }) => (
      <LoyaltyBrandLogo
        brand={item.name}
        logo={item.logoUrl}
        backgroundColor={item.backgroundColor}
        height={80}
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: Routes.SCAN,
            params: {
              brandId: item.id,
              brandName: item.name,
              defaultView: item.defaultView,
            },
          })
        }
      />
    ),
    [],
  );

  return (
    <ScreenShell>
      <ScreenHeader
        title={t("title")}
        subtitle={t("subtitle")}
        subtitleVariant="caption"
        actions={<CloseButton />}
        style={styles.header}
      />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t("searchPlaceholder")}
        editable={loaded && !error}
        style={styles.searchBar}
      />

      <DataLoadStatus error={error} loaded={loaded} loadingLabel={t("loading")}>
        <View style={styles.listSection}>
          {showEmptySearchState ? (
            <View style={styles.emptySearchState}>
              <Text
                style={[
                  styles.emptySearchTitle,
                  { color: theme.textSecondary },
                ]}
              >
                {t("emptySearchTitle", { query: trimmedQuery })}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("requestBrandAction", {
                  name: trimmedQuery,
                })}
                style={({ pressed }) => [
                  styles.requestBrandButton,
                  { backgroundColor: theme.primary },
                  pressed && styles.requestBrandButtonPressed,
                ]}
                onPress={openRequestBrandSheet}
              >
                <Text style={styles.requestBrandButtonText}>
                  {t("requestBrandAction", { name: trimmedQuery })}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <FlatList
            testID="brands-list"
            data={filteredBrands}
            keyExtractor={(item) => item.id}
            numColumns={2}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            renderItem={renderBrand}
          />
          {customCardSection}
        </View>
      </DataLoadStatus>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  searchBar: {
    marginBottom: spacing.md,
  },
  listSection: {
    flex: 1,
  },
  emptySearchState: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  emptySearchTitle: {
    ...typography.body,
    textAlign: "center",
  },
  requestBrandButton: {
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  requestBrandButtonPressed: {
    opacity: 0.85,
  },
  requestBrandButtonText: {
    ...typography.bodySemibold,
    color: "#0D1B2A",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  card: {
    flex: 0.5,
  },
  customFooter: {
    paddingTop: spacing.md,
    flexShrink: 0,
    width: "100%",
  },
  customCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    borderStyle: "dashed",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  customCardButtonPressed: {
    opacity: 0.7,
  },
  customCardTitle: {
    ...typography.bodySemibold,
  },
});
