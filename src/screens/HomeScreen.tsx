import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { FAB } from "../components/FAB";
import { LoyaltyCard } from "../components/LoyaltyCard";
import { SearchBar } from "../components/SearchBar";
import { mockCards } from "../data/mockCards";
import { useTheme } from "../theme/useTheme";

export const HomeScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar />

      <FlatList
        data={mockCards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LoyaltyCard {...item} />}
      />

      <FAB onPress={() => console.log("Add card")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
