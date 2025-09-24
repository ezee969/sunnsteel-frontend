import { usePerformanceQuery } from '@/hooks/use-performance-query';
import { rtfApi } from '../etag-client';
import type { RtfTimeline, RtfForecast } from '../types/rtf.types';

/**
 * RTF-F13: useRtFForecast hook - Abstraction for forecast endpoint with ETag caching
 */
export const useRtFForecast = (routineId: string, targetWeeks?: number[]) => {
  return usePerformanceQuery<RtfForecast, Error>({
    queryKey: ['rtf', 'forecast', routineId, targetWeeks?.join(',') ?? 'default'],
    queryFn: async () => {
      // Use ETag client for caching optimization
      const targetWeek = targetWeeks?.[0] // Use first week for now
      const response = await rtfApi.getForecast(routineId, targetWeek, {
        maxAge: 10 * 60 * 1000 // 10 minutes cache
      })
      return response.data as RtfForecast
    },
    enabled: !!routineId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  }, `RTF Forecast (${routineId})`);
};

/**
 * RTF-F14: useRtFTimeline hook - Abstraction for timeline endpoint with ETag caching
 */
export const useRtFTimeline = (routineId: string) => {
  return usePerformanceQuery<RtfTimeline, Error>({
    queryKey: ['rtf', 'timeline', routineId],
    queryFn: async () => {
      // Use ETag client for caching optimization
      const response = await rtfApi.getTimeline(routineId, {
        maxAge: 15 * 60 * 1000 // 15 minutes cache (timelines change less frequently)
      })
      return response.data as RtfTimeline
    },
    enabled: !!routineId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  }, `RTF Timeline (${routineId})`);
};