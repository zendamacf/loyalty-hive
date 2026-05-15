import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type GetApiV1CardsResponse, getApiV1Cards } from "@/lib/api-client";
import { LoyaltyBrandLogo } from "../components/LoyaltyBrandLogo";
import { SearchBar } from "../components/SearchBar";
import { colors, radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

const appIcon = require("../../assets/images/icon.png");

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
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Image
            accessibilityLabel="App logo"
            source={appIcon}
            style={styles.appLogo}
          />
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Loyalty<Text style={styles.titleHive}>Hive</Text>
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Add loyalty card"
          accessibilityRole="button"
          hitSlop={12}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push("/select-brand")}
        >
          <Text style={[styles.addButtonLabel, { color: colors.textPrimary }]}>
            +
          </Text>
        </Pressable>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search cards..."
        style={styles.searchBar}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error ? (
        <Text style={[styles.errorBanner, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <LoyaltyBrandLogo
              brand={item.label ?? item.brand?.name ?? item.cardNumber}
              logo={item.brand?.logoUrl}
              backgroundColor={item.brand?.backgroundColor}
              height={100}
              onPress={() => {
                console.log("TODO: Add card details screen");
              }}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  errorBanner: {
    marginBottom: 8,
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
  addButton: {
    height: 56,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonPressed: {
    opacity: 0.55,
  },
  addButtonLabel: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "300",
  },
  appLogo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  titleWrap: {
    height: 56,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "left",
  },
  titleHive: {
    color: colors.primary,
  },
  searchBar: {
    marginBottom: spacing.md,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  card: {
    flex: 0.5,
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
