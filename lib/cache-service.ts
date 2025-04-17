// Simple cache service for Firebase data

type CacheItem<T> = {
  data: T
  timestamp: number
  expiry: number
}

class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map()
  private defaultExpiry: number = 5 * 60 * 1000 // 5 minutes in milliseconds

  // Set data in cache
  set<T>(key: string, data: T, expiry: number = this.defaultExpiry): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
    })
  }

  // Get data from cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    // Return null if item doesn't exist
    if (!item) return null

    // Check if item has expired
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    // Check if item has expired
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // Remove item from cache
  delete(key: string): void {
    this.cache.delete(key)
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Clear expired items
  clearExpired(): void {
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() - item.timestamp > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// Create a singleton instance
const cacheService = new CacheService()

export default cacheService
