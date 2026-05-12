import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type GetApiV1CardsResponse, getApiV1Cards } from "@/lib/api-client";
import { FAB } from "../components/FAB";
import { LoyaltyCard } from "../components/LoyaltyCard";
import { SearchBar } from "../components/SearchBar";
import { spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

/** 1×1 transparent PNG if card brand URL is not available. */
const PLACEHOLDER_LOGO_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

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

export const HomeScreen = () => {
  const { colors } = useTheme();
  const [cards, setCards] = useState<GetApiV1CardsResponse>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredCards = useMemo(
    () => filterCards(cards, searchQuery),
    [cards, searchQuery],
  );

  const fetchCards = useCallback(async () => {
    setError(null);
    try {
      const { data, error } = await getApiV1Cards();
      if (error) {
        setError(error.error);
        return;
      }
      if (data) {
        setCards(data);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchCards();
    }, [fetchCards]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCards();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCards]);

  let emptyTitle: string | null = null;
  let emptySubtitle: string | null = null;
  if (loaded && !error) {
    if (cards.length === 0) {
      emptyTitle = "No loyalty cards yet";
      emptySubtitle = "Tap the + button to add your first card.";
    } else if (filteredCards.length === 0 && searchQuery.trim()) {
      emptyTitle = "No matching cards";
      emptySubtitle = "Try a different search.";
    }
  }

  const listEmpty =
    emptyTitle && emptySubtitle ? (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          {emptyTitle}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {emptySubtitle}
        </Text>
      </View>
    ) : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search cards..."
        style={{ marginBottom: spacing.md }}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error ? (
        <Text style={[styles.errorBanner, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}

      <FlatList
        style={styles.list}
        data={filteredCards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredCards.length === 0 ? styles.listContentEmpty : undefined
        }
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <LoyaltyCard
            brand={item.label ?? item.brand?.name ?? item.cardNumber}
            logo={item.brand?.logoUrl ?? PLACEHOLDER_LOGO_URI}
          />
        )}
      />

      <FAB onPress={() => router.push("/select-brand")} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    flex: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  errorBanner: {
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
