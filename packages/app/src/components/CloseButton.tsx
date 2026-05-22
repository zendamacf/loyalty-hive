import { router } from "expo-router";
import { XIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native";

import { I18nNamespace } from "@/i18n/i18n.constants";
import { icon } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type CloseButtonProps = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const CloseButton = ({ onPress, style }: CloseButtonProps) => {
  const { t } = useTranslation(I18nNamespace.Common);
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={t("close")}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        style,
      ]}
      onPress={onPress ?? (() => router.back())}
    >
      <XIcon color={theme.textPrimary} size={icon.md} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: icon.md,
    height: icon.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.55,
  },
});
