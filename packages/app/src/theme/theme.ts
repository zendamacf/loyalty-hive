export const colors = {
  primary: "#FFC43D",
  primaryDark: "#E6A800",
  secondary: "#FF8A00",

  backgroundLight: "#FFFFFF",
  backgroundDark: "#0D1B2A",

  surfaceLight: "#F8FAFC",
  surfaceDark: "#1E293B",

  /** Brand-less loyalty card tile background (distinct from app background). */
  cardFallbackLight: "#E8EEF5",
  cardFallbackDark: "#243B56",

  textPrimaryLight: "#0F172A",
  textPrimaryDark: "#F1F5F9",
  textSecondary: "#64748B",

  border: "#E2E8F0",
  success: "#22C55E",
  error: "#EF4444",

  /** Dropdown/menu depth shadow (darker than the themed background). */
  menuShadowLight: "#CBD5E1",
  menuShadowDark: "#020617",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const fontSize = {
  xs: 13,
  sm: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 28,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

/** Semantic text styles for titles, subtitles, body copy, etc. */
export const typography = {
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.md,
  },
  link: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontSize: fontSize.lg,
  },
  bodySemibold: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  bodyBold: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontSize: fontSize.sm,
  },
  small: {
    fontSize: fontSize.xs,
  },
  clearIcon: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.regular,
  },
} as const;

export const icon = {
  md: 24,
} as const;

export const transition = {
  ms: 220,
} as const;

export const brandMark = {
  heightList: 100,
  heightDetailQr: 100,
  heightDetailBarcode: 200,
} as const;
