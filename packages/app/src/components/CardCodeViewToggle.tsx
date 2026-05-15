import { BarcodeIcon, QrCodeIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useCrossfadeProgress } from "@/hooks/useCrossfadeProgress";
import { I18nNamespace } from "@/i18n/i18n.constants";
import type { CardView } from "@/lib/cardView";
import { spacing } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

const ICON_SIZE = 24;

type CardCodeViewToggleProps = {
  view: CardView;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
};

export const CardCodeViewToggle = ({
  view,
  onToggle,
  style,
}: CardCodeViewToggleProps) => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { colors } = useTheme();
  const isQr = view === "2D";
  const { opacityOff, opacityOn, iconTransform } = useCrossfadeProgress(isQr);

  return (
    <Pressable
      accessibilityLabel={isQr ? t("codeViewBarcode") : t("codeViewQr")}
      accessibilityRole="button"
      hitSlop={12}
      style={[styles.pressable, style]}
      onPress={onToggle}
    >
      <View style={styles.iconSlot}>
        <Animated.View
          style={[
            styles.iconLayer,
            { opacity: opacityOff, transform: iconTransform },
          ]}
        >
          <BarcodeIcon color={colors.textPrimary} size={ICON_SIZE} />
        </Animated.View>
        <Animated.View
          style={[
            styles.iconLayer,
            { opacity: opacityOn, transform: iconTransform },
          ]}
        >
          <QrCodeIcon color={colors.textPrimary} size={ICON_SIZE} />
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    padding: spacing.xs,
  },
  iconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
