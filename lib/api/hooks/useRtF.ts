import { usePerformanceQuery } from '@/hooks/use-performance-query';
import { rtfApi } from '../etag-client';
import type { RtfTimeline, RtfForecast } from '../types/rtf.types';

/**
 * RTF-F13: useRtFForecast hook - Abstraction for forecast endpoint with ETag caching
 */
export const useRtFForecast = (
  routineId: string,
  options?: { targetWeeks?: number[]; remaining?: boolean },
) => {
  const targetWeeks = options?.targetWeeks
  const remaining = options?.remaining ?? false
  return usePerformanceQuery<RtfForecast, Error>({
    queryKey: [
      'rtf',
      'forecast',
      routineId,
      targetWeeks?.join(',') ?? 'default',
      remaining ? 'remaining' : 'all',
    ],
    queryFn: async () => {
      const targetWeek = targetWeeks?.[0]
      const response = await rtfApi.getForecast(routineId, targetWeek, {
        maxAge: 10 * 60 * 1000,
        remaining,
      })
      return response.data as RtfForecast
    },
    enabled: !!routineId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  }, `RTF Forecast (${routineId})`)
}

/**
 * RTF-F14: useRtFTimeline hook - Abstraction for timeline endpoint with ETag caching
 */
export const useRtFTimeline = (routineId: string, remaining?: boolean) => {
  const rem = !!remaining
  return usePerformanceQuery<RtfTimeline, Error>({
    queryKey: ['rtf', 'timeline', routineId, rem ? 'remaining' : 'all'],
    queryFn: async () => {
      const response = await rtfApi.getTimeline(routineId, {
        maxAge: 15 * 60 * 1000,
        remaining: rem,
      })
      return response.data as RtfTimeline
    },
    enabled: !!routineId,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  }, `RTF Timeline (${routineId})`)
}