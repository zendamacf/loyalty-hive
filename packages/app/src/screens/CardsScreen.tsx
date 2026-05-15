import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { PlusIcon, SettingsIcon } from "lucide-react-native";
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
import { Routes } from "@/constants/routes.constants";
import { type GetApiV1CardsResponse, getApiV1Cards } from "@/lib/api-client";
import { AppTitle } from "../components/AppTitle";
import { LoyaltyBrandLogo } from "../components/LoyaltyBrandLogo";
import { SearchBar } from "../components/SearchBar";
import { radius, spacing, typography } from "../theme/theme";
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
            style={styles.logo}
          />
          <View style={styles.titleWrap}>
            <AppTitle align="left" />
          </View>
        </View>
        <Pressable
          accessibilityLabel="Add loyalty card"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
          ]}
          onPress={() => router.push(Routes.SELECT_BRAND)}
        >
          <PlusIcon color={colors.textPrimary} size={24} />
        </Pressable>
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
          ]}
          onPress={() => router.push(Routes.SETTINGS)}
        >
          <SettingsIcon color={colors.textPrimary} size={24} />
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
    ...typography.heading,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.subtitle,
    textAlign: "center",
    lineHeight: 22,
  },
});
