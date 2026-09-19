const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseSemver(
  version: string,
): { major: number; minor: number; patch: number } | null {
  const match = SEMVER_PATTERN.exec(version.trim());

  if (!match) {
    return null;
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

/** Returns negative when `left` is older than `right`, positive when newer, 0 when equal. */
export function compareSemver(left: string, right: string): number | null {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);

  if (!leftParts || !rightParts) {
    return null;
  }

  if (leftParts.major !== rightParts.major) {
    return leftParts.major - rightParts.major;
  }

  if (leftParts.minor !== rightParts.minor) {
    return leftParts.minor - rightParts.minor;
  }

  return leftParts.patch - rightParts.patch;
}

export function isBelowMinimumVersion(
  currentVersion: string,
  minimumVersion: string,
): boolean {
  const comparison = compareSemver(currentVersion, minimumVersion);

  if (comparison === null) {
    return false;
  }

  return comparison < 0;
}
