/**
 * Flags Node/Web APIs that are unavailable in React Native Hermes.
 *
 * Bun tests run with Node globals (e.g. crypto.randomUUID), so unit tests can
 * pass while production Android builds fail at runtime.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "src");

const SKIP_FILE_PATTERNS = [
  /\.unit\.test\.(ts|tsx)$/,
  /\.component\.test\.tsx$/,
  /\.integration\.test\.tsx$/,
  /localeKeys\.ts$/,
];

const RULES: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\bcrypto\.randomUUID\s*\(/,
    message: "crypto.randomUUID is not available in React Native Hermes.",
  },
  {
    pattern: /from\s+["']node:/,
    message: "Node built-in imports are not available in React Native.",
  },
];

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

let failed = false;

for (const file of await walk(ROOT)) {
  const relativePath = path.relative(ROOT, file);
  if (SKIP_FILE_PATTERNS.some((pattern) => pattern.test(relativePath))) {
    continue;
  }

  const content = await readFile(file, "utf8");

  for (const rule of RULES) {
    if (rule.pattern.test(content)) {
      console.error(`::error file=${relativePath}::${rule.message}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("RN runtime check passed.");
