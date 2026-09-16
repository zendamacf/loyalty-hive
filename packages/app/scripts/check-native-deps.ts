/**
 * Validates that react-native-worklets satisfies Reanimated's peer dependency.
 *
 * Reanimated 4 enforces this at Android build time via Gradle; a transitive
 * dependency can install an incompatible Worklets version without failing lint
 * or tests. This script catches that mismatch in CI before EAS builds.
 */
const reanimated = require("react-native-reanimated/package.json") as {
  version: string;
  peerDependencies: Record<string, string>;
};

let worklets: { version: string };
try {
  worklets = require("react-native-worklets/package.json");
} catch {
  console.error(
    "::error::Missing dependency react-native-worklets. Reanimated 4 requires Worklets 0.10.x or newer.",
  );
  process.exit(1);
}

const requiredRange = reanimated.peerDependencies["react-native-worklets"];
const [major, minor] = worklets.version.split(".").map(Number);
const compatible =
  major === 0 && minor >= 10 && minor <= 11 && worklets.version.includes(".");

if (!compatible) {
  console.error(
    `::error::react-native-worklets@${worklets.version} is not compatible with react-native-reanimated@${reanimated.version} (requires ${requiredRange}).`,
  );
  process.exit(1);
}

console.log(
  `Native dependency check passed: react-native-worklets@${worklets.version} is compatible with react-native-reanimated@${reanimated.version}.`,
);
