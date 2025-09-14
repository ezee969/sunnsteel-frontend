'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { routineService } from '@/lib/api/services/routineService';
import { workoutService } from '@/lib/api/services/workoutService';
import { useAuth } from '@/providers/auth-provider';
import { performanceMonitor } from '@/lib/utils/performance-monitor';

interface PrefetchOptions {
  immediate?: boolean;
  includeData?: boolean;
  priority?: 'high' | 'low';
}

const DEFAULT_OPTIONS: PrefetchOptions = {
  immediate: false,
  includeData: true,
  priority: 'low',
};

/**
 * Hook for coordinated prefetching of routes and data
 * Optimizes navigation performance by prefetching both Next.js pages and TanStack Query data
 */
export const useNavigationPrefetch = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, hasTriedRefresh } = useAuth();
  const prefetchedRoutes = useRef(new Set<string>());
  const prefetchedData = useRef(new Set<string>());

  const isReady = hasTriedRefresh && isAuthenticated;

  // Prefetch route with Next.js router
  const prefetchRoute = useCallback(
    async (href: string, options: PrefetchOptions = DEFAULT_OPTIONS) => {
      if (prefetchedRoutes.current.has(href)) {
        performanceMonitor.recordCacheHit(`Route: ${href}`);
        return;
      }

      const start = performance.now();
      try {
        await router.prefetch(href);
        prefetchedRoutes.current.add(href);
        const duration = performance.now() - start;
        performanceMonitor.recordPrefetch(`Route: ${href}`, duration);
      } catch (error) {
        console.warn(`Failed to prefetch route ${href}:`, error);
      }
    },
    [router]
  );

  // Prefetch data with TanStack Query
  const prefetchData = useCallback(
    async (
      dataKey: string,
      queryFn: () => Promise<any>,
      options: PrefetchOptions = DEFAULT_OPTIONS
    ) => {
      if (!isReady) return;

      if (prefetchedData.current.has(dataKey)) {
        performanceMonitor.recordCacheHit(`Data: ${dataKey}`);
        return;
      }

      const start = performance.now();
      try {
        await queryClient.prefetchQuery({
          queryKey: [dataKey],
          queryFn,
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
        prefetchedData.current.add(dataKey);
        const duration = performance.now() - start;
        performanceMonitor.recordPrefetch(`Data: ${dataKey}`, duration);
      } catch (error) {
        console.warn(`Failed to prefetch data ${dataKey}:`, error);
      }
    },
    [queryClient, isReady]
  );

  // Prefetch dashboard data
  const prefetchDashboard = useCallback(
    async (options?: PrefetchOptions) => {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      await Promise.allSettled(
        [
          prefetchRoute('/dashboard', opts),
          opts.includeData &&
            prefetchData(
              'dashboard-routines',
              () =>
                routineService.getUserRoutines({
                  isFavorite: false,
                  isCompleted: false,
                }),
              opts
            ),
          opts.includeData &&
            prefetchData(
              'dashboard-active-session',
              () => workoutService.getActiveSession(),
              opts
            ),
        ].filter(Boolean)
      );
    },
    [prefetchRoute, prefetchData]
  );

  // Prefetch routines page and data
  const prefetchRoutines = useCallback(
    async (options?: PrefetchOptions) => {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      await Promise.allSettled(
        [
          prefetchRoute('/routines', opts),
          opts.includeData &&
            prefetchData(
              'routines-all',
              () => routineService.getUserRoutines(),
              opts
            ),
          opts.includeData &&
            prefetchData(
              'routines-favorites',
              () => routineService.getUserRoutines({ isFavorite: true }),
              opts
            ),
        ].filter(Boolean)
      );
    },
    [prefetchRoute, prefetchData]
  );

  // Prefetch workouts page and data
  const prefetchWorkouts = useCallback(
    async (options?: PrefetchOptions) => {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      await Promise.allSettled(
        [
          prefetchRoute('/workouts', opts),
          opts.includeData &&
            prefetchData(
              'workouts-active-session',
              () => workoutService.getActiveSession(),
              opts
            ),
        ].filter(Boolean)
      );
    },
    [prefetchRoute, prefetchData]
  );

  // Prefetch workout history
  const prefetchWorkoutHistory = useCallback(
    async (options?: PrefetchOptions) => {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      await Promise.allSettled(
        [
          prefetchRoute('/workouts/history', opts),
          opts.includeData &&
            prefetchData(
              'workouts-history',
              () => workoutService.listSessions({ limit: 20 }),
              opts
            ),
        ].filter(Boolean)
      );
    },
    [prefetchRoute, prefetchData]
  );

  // Prefetch all main navigation pages
  const prefetchMainNavigation = useCallback(
    async (options?: PrefetchOptions) => {
      const opts: PrefetchOptions = {
        ...DEFAULT_OPTIONS,
        priority: 'high' as const,
        ...options,
      };

      await Promise.allSettled([
        prefetchDashboard(opts),
        prefetchRoutines(opts),
        prefetchWorkouts(opts),
      ]);
    },
    [prefetchDashboard, prefetchRoutines, prefetchWorkouts]
  );

  // Prefetch specific route with intelligent data prefetching
  const prefetchPage = useCallback(
    async (href: string, options?: PrefetchOptions) => {
      const opts = { ...DEFAULT_OPTIONS, ...options };

      if (href.startsWith('/dashboard')) {
        await prefetchDashboard(opts);
      } else if (href.startsWith('/routines')) {
        await prefetchRoutines(opts);
      } else if (href.startsWith('/workouts/history')) {
        await prefetchWorkoutHistory(opts);
      } else if (href.startsWith('/workouts')) {
        await prefetchWorkouts(opts);
      } else {
        // Fallback to just route prefetching
        await prefetchRoute(href, opts);
      }
    },
    [
      prefetchDashboard,
      prefetchRoutines,
      prefetchWorkouts,
      prefetchWorkoutHistory,
      prefetchRoute,
    ]
  );

  // Auto-prefetch main navigation on mount (with delay to avoid blocking initial render)
  useEffect(() => {
    if (!isReady) return;

    const timeoutId = setTimeout(() => {
      prefetchMainNavigation({ immediate: true, priority: 'low' });
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [isReady, prefetchMainNavigation]);

  // Clear cache when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      prefetchedRoutes.current.clear();
      prefetchedData.current.clear();
    }
  }, [isAuthenticated]);

  return {
    prefetchPage,
    prefetchRoute,
    prefetchData,
    prefetchDashboard,
    prefetchRoutines,
    prefetchWorkouts,
    prefetchWorkoutHistory,
    prefetchMainNavigation,
    isReady,
  };
};
