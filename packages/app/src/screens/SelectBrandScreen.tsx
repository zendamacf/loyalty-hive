import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoyaltyBrandLogo } from "@/components/LoyaltyBrandLogo";
import { type GetApiV1BrandsResponse, getApiV1Brands } from "@/lib/api-client";
import { SearchBar } from "../components/SearchBar";
import { spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const SelectBrandScreen = () => {
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
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Choose a brand
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Select the loyalty brand before scanning your card.
      </Text>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search brands..."
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
            Loading brands…
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
                  pathname: "/scan",
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
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  searchBar: {
    marginBottom: spacing.md,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  loading: {
    marginTop: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingLabel: {
    fontSize: 14,
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
