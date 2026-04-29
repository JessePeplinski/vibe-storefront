type RateLimitBucket = {
  count: number;
  resetAtMs: number;
};

export type StorefrontGenerationRateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const buckets = new Map<string, RateLimitBucket>();

function pruneExpiredBuckets(nowMs: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAtMs <= nowMs) {
      buckets.delete(key);
    }
  }
}

export function checkStorefrontGenerationRateLimit(
  key: string,
  nowMs = Date.now()
): StorefrontGenerationRateLimitResult {
  pruneExpiredBuckets(nowMs);

  const existingBucket = buckets.get(key);

  if (!existingBucket) {
    buckets.set(key, {
      count: 1,
      resetAtMs: nowMs + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true };
  }

  if (existingBucket.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existingBucket.resetAtMs - nowMs) / 1000)
      )
    };
  }

  existingBucket.count += 1;
  return { allowed: true };
}

