import { beforeEach, describe, expect, it } from "bun:test";

import {
  InMemoryRateLimitStore,
  RATE_LIMIT_SWEEP_INTERVAL_MS,
  rateLimitStore,
  resetRateLimitStoreForTests,
} from "./rate-limit-store";

describe("[Unit] InMemoryRateLimitStore", () => {
  let store: InMemoryRateLimitStore;

  beforeEach(() => {
    store = new InMemoryRateLimitStore();
  });

  it("allows requests up to the max within a window", () => {
    expect(store.consume("key", 2, 60_000).allowed).toBe(true);
    expect(store.consume("key", 2, 60_000).allowed).toBe(true);
    expect(store.consume("key", 2, 60_000).allowed).toBe(false);
  });

  it("tracks separate keys independently", () => {
    expect(store.consume("a", 1, 60_000).allowed).toBe(true);
    expect(store.consume("b", 1, 60_000).allowed).toBe(true);
    expect(store.consume("a", 1, 60_000).allowed).toBe(false);
  });

  it("sweep removes only expired buckets", () => {
    store.consume("short", 5, 10);
    store.consume("long", 5, 60_000);
    expect(store.size).toBe(2);

    store.sweep(Date.now() + 1_000);
    expect(store.size).toBe(1);
    expect(store.consume("long", 1, 60_000).allowed).toBe(false);
  });

  it("removes expired buckets on consume after the sweep interval", () => {
    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
      for (let i = 0; i < 100; i += 1) store.consume(`ip-${i}`, 5, 1_000);
      expect(store.size).toBe(100);

      now += RATE_LIMIT_SWEEP_INTERVAL_MS + 1;
      store.consume("new", 5, 1_000);
      expect(store.size).toBe(1);
    } finally {
      Date.now = realNow;
    }
  });

  it("reset clears all buckets", () => {
    store.consume("key", 1, 60_000);
    store.reset();
    expect(store.consume("key", 1, 60_000).allowed).toBe(true);
  });

  it("resetRateLimitStoreForTests clears the shared store", () => {
    rateLimitStore.consume("shared-key", 1, 60_000);
    resetRateLimitStoreForTests();
    expect(rateLimitStore.consume("shared-key", 1, 60_000).allowed).toBe(true);
  });
});
