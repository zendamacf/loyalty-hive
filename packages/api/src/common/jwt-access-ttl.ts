const TTL_UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
};

export const DEFAULT_JWT_ACCESS_TTL = "7d";

export function parseJwtAccessTtlSeconds(
  raw: string | undefined,
  fallback = DEFAULT_JWT_ACCESS_TTL,
): number {
  const value = (raw?.trim() || fallback).trim();
  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    throw new Error(
      `Invalid JWT_ACCESS_TTL "${value}" (use seconds or a duration like 15m, 24h, 7d)`,
    );
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];
  return amount * TTL_UNIT_SECONDS[unit];
}
