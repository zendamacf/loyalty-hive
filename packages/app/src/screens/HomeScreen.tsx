import { router } from "expo-router";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FAB } from "../components/FAB";
import { LoyaltyCard } from "../components/LoyaltyCard";
import { SearchBar } from "../components/SearchBar";
import { mockCards } from "../data/mockCards";
import { useTheme } from "../theme/useTheme";

export const HomeScreen = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SearchBar />

      <FlatList
        data={mockCards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LoyaltyCard {...item} />}
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
