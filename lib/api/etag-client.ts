/**
 * Enhanced HTTP Client with ETag Support
 * RTF-F04: ETag integration layer - Cache optimization with ETags
 * Handles conditional requests and cache validation for RTF data
 */

import { httpClient } from './services/httpClient'

interface ETaggedResponse<T> {
  data: T
  etag?: string
  lastModified?: string
  cacheStatus: 'hit' | 'miss' | 'stale' | 'fresh'
}

interface ETagCache<T = unknown> {
  data: T
  etag: string
  lastModified?: string
  timestamp: number
  maxAge: number
}

class ETaggedHttpClient {
  private cache = new Map<string, ETagCache>()
  private readonly defaultMaxAge = 5 * 60 * 1000 // 5 minutes

  /**
   * Clears the ETag cache for a specific key or all keys
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Gets cache info for debugging
   */
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Checks if cached data is still fresh
   */
  private isCacheFresh(cached: ETagCache): boolean {
    const now = Date.now()
    return (now - cached.timestamp) < cached.maxAge
  }

  /**
   * Makes a conditional GET request using ETags and Last-Modified headers
   * Note: This is a simplified implementation that focuses on cache management
   * The actual ETag/304 support would need backend implementation
   */
  async conditionalGet<T>(
    endpoint: string, 
    options: {
      maxAge?: number
      bypassCache?: boolean
      secure?: boolean
    } = {}
  ): Promise<ETaggedResponse<T>> {
    const cacheKey = `GET:${endpoint}`
    const cached = this.cache.get(cacheKey)
    const now = Date.now()

    // Return fresh cached data
    if (cached && this.isCacheFresh(cached) && !options.bypassCache) {
      return {
        data: cached.data as T,
        etag: cached.etag,
        lastModified: cached.lastModified,
        cacheStatus: 'fresh'
      }
    }

    try {
      // Make the actual request
      const data = await httpClient.request<T>(endpoint, {
        method: 'GET',
        secure: options.secure || false
      })

      // For now, generate a simple cache key based on data content
      // In production, this would use actual ETag headers from the backend
      const etag = `"${JSON.stringify(data).length}-${now}"`
      
      // Cache the new data
      const newCache: ETagCache = {
        data,
        etag,
        lastModified: new Date(now).toISOString(),
        timestamp: now,
        maxAge: options.maxAge || this.defaultMaxAge
      }
      this.cache.set(cacheKey, newCache)

      return {
        data,
        etag,
        lastModified: newCache.lastModified,
        cacheStatus: cached ? 'stale' : 'miss'
      }
    } catch (error) {
      // On network error, return stale cache if available
      if (cached) {
        console.warn('Network error, returning stale cache:', error)
        return {
          data: cached.data as T,
          etag: cached.etag,
          lastModified: cached.lastModified,
          cacheStatus: 'stale'
        }
      }
      throw error
    }
  }

  /**
   * Invalidates cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => pattern.test(key))
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Preloads data into cache
   */
  async preload<T>(endpoint: string, options?: { maxAge?: number; secure?: boolean }): Promise<void> {
    try {
      await this.conditionalGet<T>(endpoint, options)
    } catch (error) {
      console.warn('Failed to preload data:', endpoint, error)
    }
  }

  /**
   * Bulk invalidation for related RTF data
   */
  invalidateRtfCache(routineId: string): void {
    const rtfPattern = new RegExp(`routines/${routineId}/(rtf-|week-goals|timeline|forecast)`)
    this.invalidatePattern(rtfPattern)
  }
}

// Export singleton instance
export const etaggedHttpClient = new ETaggedHttpClient()

// Convenience functions for RTF endpoints
export const rtfApi = {
  /**
   * Fetch RTF timeline with ETag caching
   */
  getTimeline: (routineId: string, options?: { maxAge?: number }) =>
    etaggedHttpClient.conditionalGet(`/workouts/routines/${routineId}/rtf-timeline`, {
      ...options,
      secure: true
    }),

  /**
   * Fetch RTF forecast with ETag caching
   */
  getForecast: (routineId: string, targetWeek?: number, options?: { maxAge?: number }) => {
    const endpoint = targetWeek 
      ? `/workouts/routines/${routineId}/rtf-forecast?targetWeek=${targetWeek}`
      : `/workouts/routines/${routineId}/rtf-forecast`
    return etaggedHttpClient.conditionalGet(endpoint, {
      ...options,
      secure: true
    })
  },

  /**
   * Fetch RTF week goals with ETag caching
   */
  getWeekGoals: (routineId: string, week?: number, options?: { maxAge?: number }) => {
    const endpoint = week
      ? `/workouts/routines/${routineId}?week=${week}&include=rtfGoals`
      : `/workouts/routines/${routineId}?include=rtfGoals`
    return etaggedHttpClient.conditionalGet(endpoint, {
      ...options,
      secure: true
    })
  },

  /**
   * Invalidate all RTF cache for a routine
   */
  invalidateRoutine: (routineId: string) => {
    etaggedHttpClient.invalidateRtfCache(routineId)
  },

  /**
   * Preload RTF data for better performance
   */
  preloadRtfData: async (routineId: string) => {
    await Promise.allSettled([
      etaggedHttpClient.preload(`/workouts/routines/${routineId}/rtf-timeline`, { secure: true }),
      etaggedHttpClient.preload(`/workouts/routines/${routineId}/rtf-forecast`, { secure: true }),
      etaggedHttpClient.preload(`/workouts/routines/${routineId}?include=rtfGoals`, { secure: true })
    ])
  }
}

export type { ETaggedResponse }