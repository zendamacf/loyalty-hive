import { router } from "expo-router";
import { PlusIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { CloseButton } from "@/components/CloseButton";
import { LoyaltyBrandLogo } from "@/components/LoyaltyBrandLogo";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { type GetApiV1BrandsResponse, getApiV1Brands } from "@/lib/api-client";
import { SearchBar } from "../components/SearchBar";
import { icon, radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const SelectBrandScreen = () => {
  const { t } = useTranslation(I18nNamespace.Brands);
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<GetApiV1BrandsResponse>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isCustomLabelOpen, setIsCustomLabelOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data, error: apiError } = await getApiV1Brands();
        if (apiError) setError(apiError.error);
        if (data) setBrands(data);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

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

  const renderCustomFooter = useCallback(
    () => (
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
            <Text
              style={[styles.customCardTitle, { color: colors.textPrimary }]}
            >
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
    ),
    [
      canContinueToScan,
      colors.background,
      colors.border,
      colors.surface,
      colors.textPrimary,
      colors.textSecondary,
      continueToCustomScan,
      customLabel,
      isCustomLabelOpen,
      t,
    ],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.titleRow}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          accessibilityRole="header"
        >
          {t("title")}
        </Text>
        <CloseButton />
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("subtitle")}
      </Text>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t("searchPlaceholder")}
        editable={loaded && !error}
        style={styles.searchBar}
      />

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
      {!loaded && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>
            {t("loading")}
          </Text>
        </View>
      )}
      {loaded && !error && (
        <View style={styles.listSection}>
          <FlatList
            data={filteredBrands}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
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
                    },
                  })
                }
              />
            )}
          />
          {renderCustomFooter()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  subtitle: {
    marginBottom: spacing.md,
    ...typography.caption,
  },
  searchBar: {
    marginBottom: spacing.md,
  },
  errorText: {
    marginTop: spacing.sm,
    ...typography.caption,
  },
  loading: {
    marginTop: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingLabel: {
    ...typography.caption,
  },
  listSection: {
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
