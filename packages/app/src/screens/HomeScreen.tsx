import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
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

  useEffect(() => {
    (async () => {
      const { data } = await getApiV1Cards();
      if (data) setCards(data);
    })();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SearchBar />

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LoyaltyCard
            brand={item.label ?? `•••• ${item.cardNumber.slice(-4)}`}
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
});
