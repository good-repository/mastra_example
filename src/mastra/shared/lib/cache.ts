/**
 * In-memory TTL cache
 *
 * Lightweight cache to avoid redundant API calls for identical inputs.
 * Entries expire automatically after the configured TTL.
 *
 * Usage:
 *   const data = await withCache('weather:London', 30 * 60_000, () => fetchWeather('London'));
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export async function withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const cached = store.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  const data = await fn();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}
