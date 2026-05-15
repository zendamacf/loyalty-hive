import { router } from "expo-router";
import { XIcon } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoyaltyBrandLogo } from "@/components/LoyaltyBrandLogo";
import { Routes } from "@/constants/routes.constants";
import { ICON_SIZE_MD } from "@/constants/ui.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { type GetApiV1BrandsResponse, getApiV1Brands } from "@/lib/api-client";
import { SearchBar } from "../components/SearchBar";
import { spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const SelectBrandScreen = () => {
  const { t } = useTranslation(I18nNamespace.Brands);
  const { t: tCommon } = useTranslation(I18nNamespace.Common);
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<GetApiV1BrandsResponse>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

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
        <Pressable
          accessibilityLabel={tCommon("close")}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
          onPress={() => router.back()}
        >
          <XIcon color={colors.textPrimary} size={ICON_SIZE_MD} />
        </Pressable>
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
  closeButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.55,
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
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  card: {
    flex: 0.5,
  },
});
