import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type GetApiV1BrandsResponse, getApiV1Brands } from "@/lib/api-client";
import { SearchBar } from "../components/SearchBar";
import { radius, spacing } from "../theme/theme";
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
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/scan",
                  params: {
                    brandId: item.id,
                    brandName: item.name,
                  },
                })
              }
              style={[
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              <Text style={[styles.brandName, { color: colors.textPrimary }]}>
                {item.name}
              </Text>
            </Pressable>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "600",
  },
});
