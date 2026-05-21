/**
 * Utilities for i18n key validation tests.
 *
 * Limitations:
 * - Only string-literal translation keys are detected; dynamic t(expr) needs an allowlist.
 * - Scanner is regex-based, not a full TS AST.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import {
  I18N_NAMESPACES,
  I18nNamespace,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/i18n.constants";

export type QualifiedTranslationKey = `${string}:${string}`;

const LOCALES_DIR = join(import.meta.dir, "../locales");

const I18N_ENUM_MEMBER_TO_VALUE: Record<string, I18nNamespace> =
  Object.fromEntries(
    Object.entries(I18nNamespace).filter(
      (entry): entry is [string, I18nNamespace] => typeof entry[1] === "string",
    ),
  ) as Record<string, I18nNamespace>;

/** Keys used via dynamic expressions (e.g. t(LABEL_KEYS[option])). */
export const KNOWN_DYNAMIC_TRANSLATION_KEYS: QualifiedTranslationKey[] = [
  `${I18nNamespace.Cards}:sortAlphabetical`,
  `${I18nNamespace.Cards}:sortMostViewed`,
  `${I18nNamespace.Cards}:sortLastViewed`,
  `${I18nNamespace.Settings}:languageEnglish`,
  `${I18nNamespace.Settings}:languageSpanish`,
];

const SKIP_FILE_PATTERNS = [
  /\.test\.(ts|tsx)$/,
  /localeKeys\.ts$/,
  /locales\.test\.ts$/,
];

export function flattenTranslationKeys(
  obj: Record<string, unknown>,
  prefix = "",
): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(
        ...flattenTranslationKeys(value as Record<string, unknown>, path),
      );
    } else {
      keys.push(path);
    }
  }
  return keys;
}

export function loadNamespaceKeys(
  locale: SupportedLocale,
  namespace: I18nNamespace,
): Set<string> {
  const filePath = join(LOCALES_DIR, locale, `${namespace}.json`);
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return new Set(flattenTranslationKeys(parsed));
}

export function loadAllLocaleKeys(): Map<
  SupportedLocale,
  Map<I18nNamespace, Set<string>>
> {
  const result = new Map<SupportedLocale, Map<I18nNamespace, Set<string>>>();
  for (const locale of SUPPORTED_LOCALES) {
    const namespaces = new Map<I18nNamespace, Set<string>>();
    for (const namespace of I18N_NAMESPACES) {
      namespaces.set(namespace, loadNamespaceKeys(locale, namespace));
    }
    result.set(locale, namespaces);
  }
  return result;
}

export function toQualifiedKey(
  namespace: string,
  key: string,
): QualifiedTranslationKey {
  return `${namespace}:${key}`;
}

function resolveNamespaceArg(arg: string): string | null {
  const trimmed = arg.trim();
  const stringMatch = trimmed.match(/^["']([^"']+)["']$/);
  if (stringMatch) {
    return stringMatch[1] ?? null;
  }
  const enumMatch = trimmed.match(/^I18nNamespace\.(\w+)$/);
  if (enumMatch) {
    return I18N_ENUM_MEMBER_TO_VALUE[enumMatch[1] ?? ""] ?? null;
  }
  return null;
}

function parseUseTranslationNamespaces(arg: string): string[] {
  const trimmed = arg.trim();
  const arrayMatch = trimmed.match(/^\[(.*)\]$/s);
  if (arrayMatch) {
    const inner = arrayMatch[1] ?? "";
    return inner
      .split(",")
      .map((part) => resolveNamespaceArg(part))
      .filter((ns): ns is string => ns !== null);
  }
  const single = resolveNamespaceArg(trimmed);
  return single ? [single] : [];
}

function parseTranslatorBindings(content: string): Map<string, string> {
  const bindings = new Map<string, string>();

  const hookRegex =
    /const\s*\{\s*([^}]+)\s*\}\s*=\s*useTranslation\s*\(\s*([^)]+)\s*\)/g;
  let match: RegExpExecArray | null = hookRegex.exec(content);
  while (match !== null) {
    const destructuring = match[1] ?? "";
    const namespaces = parseUseTranslationNamespaces(match[2] ?? "");
    const defaultNamespace = namespaces[0];
    if (!defaultNamespace) {
      match = hookRegex.exec(content);
      continue;
    }

    for (const part of destructuring.split(",")) {
      const segment = part.trim();
      if (!segment) continue;
      const aliasMatch = segment.match(/^t\s*:\s*(\w+)$/);
      if (aliasMatch) {
        bindings.set(aliasMatch[1] ?? "", defaultNamespace);
        continue;
      }
      if (segment === "t") {
        bindings.set("t", defaultNamespace);
      }
    }
    match = hookRegex.exec(content);
  }

  return bindings;
}

function extractNsOverride(options: string): string | null {
  const nsMatch = options.match(
    /\bns\s*:\s*(I18nNamespace\.\w+|["'][^"']+["'])/,
  );
  if (!nsMatch) return null;
  return resolveNamespaceArg(nsMatch[1] ?? "");
}

function collectFromTranslatorCalls(
  content: string,
  bindings: Map<string, string>,
  used: Set<QualifiedTranslationKey>,
): void {
  for (const [fnName, defaultNamespace] of bindings) {
    const callRegex = new RegExp(
      `\\b${fnName}\\s*\\(\\s*["']([^"']+)["'](?:\\s*,\\s*(\\{[^}]*\\}))?`,
      "g",
    );
    let match: RegExpExecArray | null = callRegex.exec(content);
    while (match !== null) {
      const key = match[1] ?? "";
      const options = match[2];
      const namespace =
        (options ? extractNsOverride(options) : null) ?? defaultNamespace;
      used.add(toQualifiedKey(namespace, key));
      match = callRegex.exec(content);
    }
  }
}

function collectFromI18nT(
  content: string,
  used: Set<QualifiedTranslationKey>,
): void {
  const literalRegex = /i18n\.t\s*\(\s*["']([^"']+)["']/g;
  let match: RegExpExecArray | null = literalRegex.exec(content);
  while (match !== null) {
    const qualified = match[1] ?? "";
    const colon = qualified.indexOf(":");
    if (colon > 0) {
      used.add(
        toQualifiedKey(qualified.slice(0, colon), qualified.slice(colon + 1)),
      );
    }
    match = literalRegex.exec(content);
  }

  const templateRegex =
    /i18n\.t\s*\(\s*`\$\{I18nNamespace\.(\w+)\}:([^`]+)`\s*\)/g;
  match = templateRegex.exec(content);
  while (match !== null) {
    const ns = I18N_ENUM_MEMBER_TO_VALUE[match[1] ?? ""];
    const key = match[2] ?? "";
    if (ns) {
      used.add(toQualifiedKey(ns, key));
    }
    match = templateRegex.exec(content);
  }
}

function shouldScanFile(relativePath: string): boolean {
  return !SKIP_FILE_PATTERNS.some((pattern) => pattern.test(relativePath));
}

function walkSourceFiles(
  dir: string,
  srcRoot: string,
  files: string[] = [],
): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      walkSourceFiles(fullPath, srcRoot, files);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    const rel = relative(srcRoot, fullPath);
    if (shouldScanFile(rel)) {
      files.push(fullPath);
    }
  }
  return files;
}

export function collectUsedTranslationKeys(
  srcRoot: string,
): Set<QualifiedTranslationKey> {
  const used = new Set<QualifiedTranslationKey>(KNOWN_DYNAMIC_TRANSLATION_KEYS);

  for (const filePath of walkSourceFiles(srcRoot, srcRoot)) {
    const content = readFileSync(filePath, "utf8");
    const bindings = parseTranslatorBindings(content);
    collectFromTranslatorCalls(content, bindings, used);
    collectFromI18nT(content, used);
  }

  return used;
}

export function loadEnglishTranslationKeys(): Set<QualifiedTranslationKey> {
  const keys = new Set<QualifiedTranslationKey>();
  for (const namespace of I18N_NAMESPACES) {
    for (const key of loadNamespaceKeys("en", namespace)) {
      keys.add(toQualifiedKey(namespace, key));
    }
  }
  return keys;
}

export function compareLocaleParity(): string[] {
  const all = loadAllLocaleKeys();
  const mismatches: string[] = [];
  const [referenceLocale, ...otherLocales] = SUPPORTED_LOCALES;

  for (const namespace of I18N_NAMESPACES) {
    const referenceKeys = all.get(referenceLocale)?.get(namespace);
    if (!referenceKeys) continue;

    for (const locale of otherLocales) {
      const localeKeys = all.get(locale)?.get(namespace);
      if (!localeKeys) continue;

      for (const key of referenceKeys) {
        if (!localeKeys.has(key)) {
          mismatches.push(
            `${locale}:${namespace}:${key} (missing translation)`,
          );
        }
      }
      for (const key of localeKeys) {
        if (!referenceKeys.has(key)) {
          mismatches.push(
            `${locale}:${namespace}:${key} (extra vs ${referenceLocale})`,
          );
        }
      }
    }
  }

  return mismatches.sort();
}
