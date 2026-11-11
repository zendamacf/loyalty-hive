import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import type {
  GetApiV1BrandsResponse,
  GetApiV1CardsResponse,
} from "@/lib/api-client";

/**
 * Offline cache for the card list and brand list.
 *
 * Cards contain card numbers, so they live in `expo-secure-store` (Keychain /
 * Android Keystore-backed encryption). SecureStore values should stay small
 * (~2KB), so each card is its own item and a small index keeps the order per
 * sort mode. Brands are public catalogue data and are kept in AsyncStorage.
 */

export const CARD_INDEX_KEY = "loyalty-hive.cache.cards.index";
export const CARD_ITEM_KEY_PREFIX = "loyalty-hive.cache.card.";
export const BRANDS_CACHE_KEY = "loyalty-hive.cache.brands";

type CardIndex = Record<string, string[]>;
type CachedCard = GetApiV1CardsResponse[number];

const cardItemKey = (id: string) => `${CARD_ITEM_KEY_PREFIX}${id}`;

async function readIndex(): Promise<CardIndex> {
  try {
    const raw = await SecureStore.getItemAsync(CARD_INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as CardIndex) : {};
  } catch {
    return {};
  }
}

/**
 * Writes and clears are serialized, and a clear invalidates any write that was
 * requested before it, so a slow save can never restore cards after sign out.
 */
let queue: Promise<unknown> = Promise.resolve();
let generation = 0;
/** What is currently stored per key, so unchanged cards are not rewritten. */
const written = new Map<string, string>();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

async function setIfChanged(key: string, value: string): Promise<void> {
  if (written.get(key) === value) {
    return;
  }
  await SecureStore.setItemAsync(key, value);
  written.set(key, value);
}

async function deleteItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
  written.delete(key);
}

export function saveCachedCards(
  sort: string,
  cards: GetApiV1CardsResponse,
): Promise<void> {
  const requestedAt = generation;
  return enqueue(async () => {
    if (requestedAt !== generation) {
      return;
    }

    await Promise.all(
      cards.map((card) =>
        setIfChanged(cardItemKey(card.id), JSON.stringify(card)),
      ),
    );

    const previous = await readIndex();
    const next: CardIndex = { ...previous, [sort]: cards.map((c) => c.id) };
    await setIfChanged(CARD_INDEX_KEY, JSON.stringify(next));

    const stillReferenced = new Set(Object.values(next).flat());
    const orphaned = Object.values(previous)
      .flat()
      .filter((id) => !stillReferenced.has(id));
    await Promise.all(
      [...new Set(orphaned)].map((id) => deleteItem(cardItemKey(id))),
    );
  });
}

export async function loadCachedCards(
  sort: string,
): Promise<GetApiV1CardsResponse | null> {
  const ids = (await readIndex())[sort];
  if (!ids) {
    return null;
  }

  const raws = await Promise.all(
    ids.map((id) => SecureStore.getItemAsync(cardItemKey(id))),
  );
  if (raws.some((raw) => !raw)) {
    return null;
  }
  return raws.map((raw) => JSON.parse(raw as string) as CachedCard);
}

export async function saveCachedBrands(
  brands: GetApiV1BrandsResponse,
): Promise<void> {
  await AsyncStorage.setItem(BRANDS_CACHE_KEY, JSON.stringify(brands));
}

export async function loadCachedBrands(): Promise<GetApiV1BrandsResponse | null> {
  const raw = await AsyncStorage.getItem(BRANDS_CACHE_KEY);
  return raw ? (JSON.parse(raw) as GetApiV1BrandsResponse) : null;
}

/** Remove every cached card and brand. Call on sign out / account deletion only. */
export function clearOfflineCache(): Promise<void> {
  generation += 1;
  return enqueue(async () => {
    const index = await readIndex();
    const ids = new Set(Object.values(index).flat());
    await Promise.all([
      ...[...ids].map((id) => deleteItem(cardItemKey(id))),
      deleteItem(CARD_INDEX_KEY),
      AsyncStorage.removeItem(BRANDS_CACHE_KEY),
    ]);
    written.clear();
  });
}
