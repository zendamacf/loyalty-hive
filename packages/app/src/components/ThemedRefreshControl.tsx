import { RefreshControl } from "react-native";

import { useTheme } from "../theme/useTheme";

export type ThemedRefreshControlProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

export const ThemedRefreshControl = ({
  refreshing,
  onRefresh,
}: ThemedRefreshControlProps) => {
  const { colors } = useTheme();

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  );
};
