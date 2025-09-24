/**
 * RTF Offline Cache Service  
 * RTF-F10: Offline cache for week goals + timeline
 * Implements IndexedDB caching with service worker integration
 */

interface RtfCacheItem {
  key: string
  data: unknown
  timestamp: number
  version: number
  ttl: number // Time to live in milliseconds
}

interface RtfCacheOptions {
  ttl?: number
  version?: number
  forceRefresh?: boolean
}

class RtfOfflineCache {
  private dbName = 'sunsteel-rtf-cache'
  private dbVersion = 1
  private storeName = 'rtf-data'
  private db: IDBDatabase | null = null

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined') return // Skip in SSR
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object store with key path
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp')
          store.createIndex('version', 'version')
        }
      }
    })
  }

  /**
   * Check if cached data is still valid
   */
  private isValid(item: RtfCacheItem): boolean {
    const now = Date.now()
    return (now - item.timestamp) < item.ttl
  }

  /**
   * Generate cache key for RTF data
   */
  private getCacheKey(routineId: string, type: 'timeline' | 'forecast' | 'weekGoals', params?: Record<string, string>): string {
    const baseKey = `rtf:${routineId}:${type}`
    if (params) {
      const paramStr = new URLSearchParams(params).toString()
      return `${baseKey}:${paramStr}`
    }
    return baseKey
  }

  /**
   * Store data in cache
   */
  async set(
    routineId: string, 
    type: 'timeline' | 'forecast' | 'weekGoals', 
    data: unknown,
    options: RtfCacheOptions = {}
  ): Promise<void> {
    if (!this.db) await this.init()
    if (!this.db) return

    const key = this.getCacheKey(routineId, type)
    const item: RtfCacheItem = {
      key,
      data,
      timestamp: Date.now(),
      version: options.version || 1,
      ttl: options.ttl || (15 * 60 * 1000) // Default 15 minutes
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.put(item)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Retrieve data from cache
   */
  async get(
    routineId: string, 
    type: 'timeline' | 'forecast' | 'weekGoals',
    options: RtfCacheOptions = {}
  ): Promise<unknown | null> {
    if (!this.db) await this.init()
    if (!this.db) return null

    const key = this.getCacheKey(routineId, type)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const item = request.result as RtfCacheItem
        
        if (!item) {
          resolve(null)
          return
        }

        // Check if data is still valid
        if (!options.forceRefresh && this.isValid(item)) {
          // Check version compatibility if specified
          if (options.version && item.version !== options.version) {
            resolve(null) // Version mismatch, treat as cache miss
            return
          }
          
          resolve(item.data)
        } else {
          // Expired or force refresh, remove from cache
          this.delete(routineId, type)
          resolve(null)
        }
      }
    })
  }

  /**
   * Remove data from cache
   */
  async delete(routineId: string, type: 'timeline' | 'forecast' | 'weekGoals'): Promise<void> {
    if (!this.db) return

    const key = this.getCacheKey(routineId, type)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.delete(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Clear all cache for a routine
   */
  async clearRoutine(routineId: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      // Get all keys for this routine
      const request = store.openCursor()
      request.onerror = () => reject(request.error)
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const item = cursor.value as RtfCacheItem
          if (item.key.startsWith(`rtf:${routineId}:`)) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.openCursor()
      request.onerror = () => reject(request.error)
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const item = cursor.value as RtfCacheItem
          if (!this.isValid(item)) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalItems: number
    validItems: number
    expiredItems: number
    sizeEstimate: string
  }> {
    if (!this.db) {
      await this.init()
      if (!this.db) return { totalItems: 0, validItems: 0, expiredItems: 0, sizeEstimate: '0KB' }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.openCursor()
      let totalItems = 0
      let validItems = 0
      let expiredItems = 0
      let sizeEstimate = 0
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const item = cursor.value as RtfCacheItem
          totalItems++
          
          if (this.isValid(item)) {
            validItems++
          } else {
            expiredItems++
          }
          
          // Rough size estimate
          sizeEstimate += JSON.stringify(item).length
          
          cursor.continue()
        } else {
          resolve({
            totalItems,
            validItems,
            expiredItems,
            sizeEstimate: `${Math.round(sizeEstimate / 1024)}KB`
          })
        }
      }
    })
  }
}

// Export singleton instance
export const rtfOfflineCache = new RtfOfflineCache()

// Cache-aware RTF API functions
export const rtfCacheApi = {
  /**
   * Get RTF timeline with offline cache fallback
   */
  async getTimeline(routineId: string, options: RtfCacheOptions = {}) {
    try {
      // Try cache first
      const cached = await rtfOfflineCache.get(routineId, 'timeline', options)
      if (cached && !options.forceRefresh) {
        return { data: cached, fromCache: true }
      }

      // Fallback to network (would use rtfApi here)
      console.log('Timeline cache miss, would fetch from network for:', routineId)
      return { data: null, fromCache: false }
      
    } catch (error) {
      console.warn('RTF timeline cache error:', error)
      return { data: null, fromCache: false }
    }
  },

  /**
   * Get RTF forecast with offline cache fallback
   */
  async getForecast(routineId: string, options: RtfCacheOptions = {}) {
    try {
      const cached = await rtfOfflineCache.get(routineId, 'forecast', options)
      if (cached && !options.forceRefresh) {
        return { data: cached, fromCache: true }
      }

      console.log('Forecast cache miss, would fetch from network for:', routineId)
      return { data: null, fromCache: false }
      
    } catch (error) {
      console.warn('RTF forecast cache error:', error)
      return { data: null, fromCache: false }
    }
  },

  /**
   * Get RTF week goals with offline cache fallback
   */
  async getWeekGoals(routineId: string, options: RtfCacheOptions = {}) {
    try {
      const cached = await rtfOfflineCache.get(routineId, 'weekGoals', options)
      if (cached && !options.forceRefresh) {
        return { data: cached, fromCache: true }
      }

      console.log('Week goals cache miss, would fetch from network for:', routineId)
      return { data: null, fromCache: false }
      
    } catch (error) {
      console.warn('RTF week goals cache error:', error)
      return { data: null, fromCache: false }
    }
  },

  /**
   * Preload RTF data into cache
   */
  async preloadData(routineId: string) {
    // This would typically fetch from network and store in cache
    console.log('Preloading RTF data for:', routineId)
  },

  /**
   * Invalidate all cache for a routine
   */
  async invalidateRoutine(routineId: string) {
    await rtfOfflineCache.clearRoutine(routineId)
  }
}

export type { RtfCacheOptions }