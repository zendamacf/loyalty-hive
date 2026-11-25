type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitConsumeResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

/** How often expired buckets are removed. */
export const RATE_LIMIT_SWEEP_INTERVAL_MS = 60_000;

export class InMemoryRateLimitStore {
  private buckets = new Map<string, Bucket>();
  private nextSweepAt = 0;

  /** Number of keys in memory. For tests and monitoring. */
  get size(): number {
    return this.buckets.size;
  }

  /** Removes expired buckets, so many different keys do not fill memory. */
  sweep(now = Date.now()): void {
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) this.buckets.delete(key);
    }
    this.nextSweepAt = now + RATE_LIMIT_SWEEP_INTERVAL_MS;
  }

  consume(key: string, max: number, windowMs: number): RateLimitConsumeResult {
    const now = Date.now();
    if (now >= this.nextSweepAt) this.sweep(now);
    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }

    if (bucket.count >= max) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      };
    }

    bucket.count += 1;
    return { allowed: true };
  }

  reset(): void {
    this.buckets.clear();
    this.nextSweepAt = 0;
  }
}

export const rateLimitStore = new InMemoryRateLimitStore();

export function resetRateLimitStoreForTests(): void {
  rateLimitStore.reset();
}
