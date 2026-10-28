/** Small in-memory fixed-window limiter (per server process; the app runs on a single machine). */
export function createLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    isLimited(key: string): boolean {
      const entry = hits.get(key);
      return !!entry && entry.resetAt > Date.now() && entry.count >= max;
    },
    record(key: string) {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count++;
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
    },
    clear(key: string) {
      hits.delete(key);
    },
  };
}

/** Failed login attempts per IP + email. */
const logins = createLimiter({ windowMs: 15 * 60 * 1000, max: 8 });

export const isRateLimited = (key: string) => logins.isLimited(key);
export const recordFailedAttempt = (key: string) => logins.record(key);
export const clearAttempts = (key: string) => logins.clear(key);
