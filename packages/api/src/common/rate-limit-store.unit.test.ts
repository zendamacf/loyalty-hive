import { beforeEach, describe, expect, it } from "bun:test";

import {
  InMemoryRateLimitStore,
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
