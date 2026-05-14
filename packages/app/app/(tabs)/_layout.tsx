import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

import { colors } from "../../src/theme/theme";

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <Tabs
      initialRouteName="cards"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surfaceDark : colors.surfaceLight,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="cards" options={{ title: "Cards" }} />
      <Tabs.Screen name="you" options={{ title: "You" }} />
    </Tabs>
  );
}
