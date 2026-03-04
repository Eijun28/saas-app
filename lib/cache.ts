/**
 * Simple in-memory TTL cache for page data.
 * Eliminates refetch on every section navigation.
 * Data is served instantly from cache on revisit;
 * a background refresh silently updates stale entries.
 *
 * Bounded at MAX_ENTRIES to prevent unbounded memory growth
 * in long-running serverless instances.
 */

const DEFAULT_TTL = 60_000 // 60 seconds
const MAX_ENTRIES = 500

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
  // Evict expired entries first (cheap amortised cleanup)
  if (store.size >= MAX_ENTRIES) {
    const now = Date.now()
    for (const [k, v] of store) {
      if (now - v.ts > DEFAULT_TTL) {
        store.delete(k)
      }
      if (store.size < MAX_ENTRIES) break
    }

    // If still at capacity after evicting expired, remove the oldest entry
    if (store.size >= MAX_ENTRIES) {
      let oldestKey: string | undefined
      let oldestTs = Infinity
      for (const [k, v] of store) {
        if (v.ts < oldestTs) {
          oldestTs = v.ts
          oldestKey = k
        }
      }
      if (oldestKey !== undefined) store.delete(oldestKey)
    }
  }

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
