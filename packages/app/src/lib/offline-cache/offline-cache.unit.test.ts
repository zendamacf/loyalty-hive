import { beforeEach, describe, expect, test } from "bun:test";

import { testCards } from "../../../test/fixtures/cards";
import {
  clearSecureStoreMock,
  secureStoreGetMock,
  secureStoreSetMock,
} from "../../../test/mocks/expo-secure-store";
import {
  CARD_INDEX_KEY,
  clearOfflineCache,
  loadCachedBrands,
  loadCachedCards,
  saveCachedBrands,
  saveCachedCards,
} from "./offline-cache";

describe("[Unit] offline-cache", () => {
  beforeEach(async () => {
    await clearOfflineCache();
    clearSecureStoreMock();
  });

  test("returns null when nothing is cached", async () => {
    expect(await loadCachedCards("alphabetical")).toBeNull();
    expect(await loadCachedBrands()).toBeNull();
  });

  test("round-trips cards per sort in order", async () => {
    const reversed = [...testCards].reverse();
    await saveCachedCards("alphabetical", testCards);
    await saveCachedCards("most_viewed", reversed);

    expect(await loadCachedCards("alphabetical")).toEqual(testCards);
    expect(await loadCachedCards("most_viewed")).toEqual(reversed);
  });

  test("drops cards that were deleted on the server", async () => {
    await saveCachedCards("alphabetical", testCards);
    await saveCachedCards("alphabetical", testCards.slice(0, 1));

    expect(await loadCachedCards("alphabetical")).toHaveLength(1);
    const removed = testCards[testCards.length - 1];
    expect(
      await secureStoreGetMock(`loyalty-hive.cache.card.${removed.id}`),
    ).toBeNull();
  });

  test("round-trips brands", async () => {
    const brands = [{ id: "b1", name: "ASOS" }] as never;
    await saveCachedBrands(brands);
    expect(await loadCachedBrands()).toEqual(brands);
  });

  test("clearOfflineCache removes cards, index and brands", async () => {
    await saveCachedCards("alphabetical", testCards);
    await saveCachedBrands([] as never);

    await clearOfflineCache();

    expect(await loadCachedCards("alphabetical")).toBeNull();
    expect(await secureStoreGetMock(CARD_INDEX_KEY)).toBeNull();
    expect(
      await secureStoreGetMock(`loyalty-hive.cache.card.${testCards[0].id}`),
    ).toBeNull();
    expect(await loadCachedBrands()).toBeNull();
  });

  test("does not rewrite unchanged cards", async () => {
    await saveCachedCards("alphabetical", testCards);
    secureStoreSetMock.mockClear();

    await saveCachedCards("alphabetical", testCards);

    expect(secureStoreSetMock).not.toHaveBeenCalled();
  });

  test("a save requested before a clear cannot restore cards", async () => {
    const pendingSave = saveCachedCards("alphabetical", testCards);
    const pendingClear = clearOfflineCache();
    await Promise.all([pendingSave, pendingClear]);

    expect(await loadCachedCards("alphabetical")).toBeNull();
    expect(await secureStoreGetMock(CARD_INDEX_KEY)).toBeNull();
  });
});
