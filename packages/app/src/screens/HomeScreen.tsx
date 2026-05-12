import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type GetApiV1CardsResponse, getApiV1Cards } from "@/lib/api-client";
import { FAB } from "../components/FAB";
import { LoyaltyCard } from "../components/LoyaltyCard";
import { SearchBar } from "../components/SearchBar";
import { useTheme } from "../theme/useTheme";

/** 1×1 transparent PNG if card brand URL is not available. */
const PLACEHOLDER_LOGO_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export const HomeScreen = () => {
  const { colors } = useTheme();
  const [cards, setCards] = useState<GetApiV1CardsResponse>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await getApiV1Cards();
      if (error) setError(error.error);
      if (data) setCards(data);
    })();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SearchBar />

      {error && <Text style={{ color: colors.error }}>{error}</Text>}
      {cards.length > 0 && (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LoyaltyCard
              brand={item.label ?? item.brand?.name ?? item.cardNumber}
              logo={item.brand?.logoUrl ?? PLACEHOLDER_LOGO_URI}
            />
          )}
        />
      )}

      <FAB onPress={() => router.push("/select-brand")} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
