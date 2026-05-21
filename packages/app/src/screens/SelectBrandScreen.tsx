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
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/Button";
import { CloseButton } from "@/components/CloseButton";
import { DataLoadStatus } from "@/components/DataLoadStatus";
import { LoyaltyBrandLogo } from "@/components/LoyaltyBrandLogo";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  type GetApiV1BrandsResponse,
  getApiV1BrandsOptions,
} from "@/lib/api-client";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { SearchBar } from "../components/SearchBar";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useThemedRefreshControl } from "../hooks/useThemedRefreshControl";
import { icon, radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

type Brand = GetApiV1BrandsResponse[number];

export const SelectBrandScreen = () => {
  const { t } = useTranslation(I18nNamespace.Brands);
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [isCustomLabelOpen, setIsCustomLabelOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");

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

  const trimmedCustomLabel = customLabel.trim();
  const canContinueToScan = trimmedCustomLabel.length > 0;

  const continueToCustomScan = useCallback(() => {
    if (!canContinueToScan) {
      return;
    }
    router.push({
      pathname: Routes.SCAN,
      params: { label: trimmedCustomLabel },
    });
  }, [canContinueToScan, trimmedCustomLabel]);

  const customCardSection = (
    <View style={styles.customFooter}>
      {!isCustomLabelOpen ? (
        <Pressable
          accessibilityLabel={t("customCardTitle")}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.customCardButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
            pressed && styles.customCardButtonPressed,
          ]}
          onPress={() => setIsCustomLabelOpen(true)}
        >
          <PlusIcon color={colors.textPrimary} size={icon.md} />
          <Text style={[styles.customCardTitle, { color: colors.textPrimary }]}>
            {t("customCardTitle")}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.customLabelForm}>
          <Text
            style={[styles.customLabelHeading, { color: colors.textPrimary }]}
          >
            {t("customCardLabel")}
          </Text>
          <TextInput
            accessibilityLabel={t("customCardLabel")}
            value={customLabel}
            onChangeText={setCustomLabel}
            placeholder={t("customCardPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            style={[
              styles.customLabelInput,
              {
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.background,
              },
            ]}
          />
          <Button
            title={t("continueToScan")}
            onPress={continueToCustomScan}
            disabled={!canContinueToScan}
          />
        </View>
      )}
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
          <FlatList
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
  customLabelForm: {
    gap: spacing.sm,
  },
  customLabelHeading: {
    ...typography.label,
  },
  customLabelInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
});
