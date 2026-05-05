import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mockBrands } from "../data/mockBrands";
import { radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const SelectBrandScreen = () => {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const filteredBrands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return mockBrands;
    }

    return mockBrands.filter((brand) =>
      brand.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

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

      <View
        style={[styles.searchContainer, { backgroundColor: colors.surface }]}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search brands..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

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
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Image source={{ uri: item.logo }} style={styles.logo} />
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
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
  searchContainer: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    fontSize: 16,
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
