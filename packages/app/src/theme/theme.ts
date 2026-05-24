export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
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
  light: "300",
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
  labelHint: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.light,
    opacity: 0.6,
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
  sm: 20,
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
