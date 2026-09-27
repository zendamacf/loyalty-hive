type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitConsumeResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export class InMemoryRateLimitStore {
  private buckets = new Map<string, Bucket>();

  consume(key: string, max: number, windowMs: number): RateLimitConsumeResult {
    const now = Date.now();
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
  }
}

export const rateLimitStore = new InMemoryRateLimitStore();

export function resetRateLimitStoreForTests(): void {
  rateLimitStore.reset();
}
