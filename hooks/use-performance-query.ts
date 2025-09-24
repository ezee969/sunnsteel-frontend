'use client';

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { performanceMonitor } from '@/lib/utils/performance-monitor';
import { useEffect, useRef } from 'react';

/**
 * Enhanced useQuery hook that adds performance monitoring for first data fetch timing
 * @param options - Standard TanStack Query options
 * @param performanceLabel - Optional label for performance tracking (defaults to queryKey)
 * @returns Standard UseQueryResult with performance monitoring
 */
export function usePerformanceQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  performanceLabel?: string
): UseQueryResult<TData, TError> {
  const firstFetchRef = useRef<boolean>(true);
  const fetchStartTimeRef = useRef<number | null>(null);
  
  const shouldLog = process.env.NODE_ENV === 'development' || 
                   process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS === 'true';

  // Wrap the original queryFn to add performance monitoring
  const enhancedOptions: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> = {
    ...options,
    queryFn: options.queryFn && typeof options.queryFn === 'function' ? async (...args: Parameters<NonNullable<typeof options.queryFn>>) => {
      const label = performanceLabel || `Query: ${JSON.stringify(options.queryKey)}`;
      
      if (shouldLog && firstFetchRef.current) {
        fetchStartTimeRef.current = performance.now();
      }

      try {
        const result = await (options.queryFn as any)(...args);
        
        if (shouldLog && firstFetchRef.current && fetchStartTimeRef.current !== null) {
          const duration = performance.now() - fetchStartTimeRef.current;
          performanceMonitor.recordMetric(`First Fetch: ${label}`, duration, 'component');
          firstFetchRef.current = false;
        }
        
        return result;
      } catch (error) {
        if (shouldLog && firstFetchRef.current && fetchStartTimeRef.current !== null) {
          const duration = performance.now() - fetchStartTimeRef.current;
          performanceMonitor.recordMetric(`First Fetch Error: ${label}`, duration, 'component');
          firstFetchRef.current = false;
        }
        throw error;
      }
    } : options.queryFn,
  };

  const result = useQuery(enhancedOptions);

  // Monitor refetches separately (not just first fetch)
  useEffect(() => {
    if (shouldLog && result.isFetching && !firstFetchRef.current) {
      const refetchStart = performance.now();
      const cleanup = () => {
        if (!result.isFetching) {
          const duration = performance.now() - refetchStart;
          const label = performanceLabel || `Query: ${JSON.stringify(options.queryKey)}`;
          performanceMonitor.recordMetric(`Refetch: ${label}`, duration, 'component');
        }
      };
      
      // Note: This is a simplified approach - in a production app you might want
      // more sophisticated tracking of when the fetch actually completes
      const timeoutId = setTimeout(cleanup, 50); // Check after 50ms
      return () => clearTimeout(timeoutId);
    }
  }, [result.isFetching, result.isSuccess, result.isError, shouldLog, performanceLabel, options.queryKey]);

  return result;
}

/**
 * Hook to get performance insights for queries
 * @returns Performance monitoring utilities
 */
export const useQueryPerformance = () => {
  return {
    getMetrics: () => performanceMonitor.getMetrics('component'),
    generateReport: () => performanceMonitor.generateReport(),
    getAverageFirstFetch: () => {
      const metrics = performanceMonitor.getMetrics('component');
      const firstFetchMetrics = metrics.filter(m => m.name.startsWith('First Fetch:'));
      if (firstFetchMetrics.length === 0) return 0;
      
      const sum = firstFetchMetrics.reduce((acc, m) => acc + m.value, 0);
      return sum / firstFetchMetrics.length;
    },
  };
};