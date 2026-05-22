import { readableForeground } from "@/theme/themes";

type Rgb = { r: number; g: number; b: number };

/** WCAG relative luminance; sRGB channel 0–255. */
function relativeLuminance({ r, g, b }: Rgb): number {
  const toLinear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function parseHexColor(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hex)) {
    return null;
  }

  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function parseRgbColor(value: string): Rgb | null {
  const match = value
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!match) {
    return null;
  }

  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  if ([r, g, b].some((channel) => Number.isNaN(channel) || channel < 0)) {
    return null;
  }

  return {
    r: Math.min(255, Math.round(r)),
    g: Math.min(255, Math.round(g)),
    b: Math.min(255, Math.round(b)),
  };
}

export function parseCssColor(value: string): Rgb | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    return parseHexColor(trimmed);
  }
  if (trimmed.startsWith("rgb")) {
    return parseRgbColor(trimmed);
  }
  return parseHexColor(`#${trimmed}`);
}

/**
 * Picks light or dark foreground text for readable contrast on `backgroundColor`.
 */
export function getReadableTextColor(backgroundColor: string): string {
  const rgb = parseCssColor(backgroundColor);
  if (!rgb) {
    return readableForeground.onLightBackground;
  }

  const light = readableForeground.onLightBackground;
  const dark = readableForeground.onDarkBackground;
  return relativeLuminance(rgb) > 0.55 ? light : dark;
}
