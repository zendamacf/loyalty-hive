import { useMemo } from "react";
import { RefreshControl } from "react-native";

import { useTheme } from "@/theme/useTheme";

/**
 * Returns a memoized RefreshControl for FlatList/ScrollView.
 * Must be a native RefreshControl element — not a wrapper component — because
 * Android clones refreshControl and passes the scroll view as its child.
 */
export function useThemedRefreshControl(
  refreshing: boolean,
  onRefresh: () => void,
) {
  const { theme } = useTheme();

  return useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={theme.primary}
        colors={[theme.primary]}
      />
    ),
    [refreshing, onRefresh, theme.primary],
  );
}
