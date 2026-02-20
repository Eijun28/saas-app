/**
 * Simple in-memory TTL cache for page data.
 * Eliminates refetch on every section navigation.
 * Data is served instantly from cache on revisit;
 * a background refresh silently updates stale entries.
 */

const DEFAULT_TTL = 60_000 // 60 seconds

interface CacheEntry<T> {
  data: T
  ts: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.ts > ttl) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() })
}

export function invalidateCache(key: string): void {
  store.delete(key)
}

export function invalidateCachePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
