'use client';

import dynamic from 'next/dynamic';

// Dynamic imports with preloading for heavy components
// Using Next.js dynamic() for better SSR support and loading states

/**
 * Dashboard Stats Components - Heavy with charts/visualizations
 */
export const DashboardStats = dynamic(
  () => import('@/app/(protected)/dashboard/components/StatsOverview'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse"></div>
        ))}
      </div>
    ),
  }
);

// Preload functions for critical components that exist
export const preloadComponents = {
  dashboardStats: () => {
    // Preload stats when user hovers over dashboard
    import('@/app/(protected)/dashboard/components/StatsOverview');
  },

  // Preload existing pages
  routinesPage: () => {
    import('@/app/(protected)/routines/page');
  },

  workoutsPage: () => {
    import('@/app/(protected)/workouts/page');
  },

  dashboardPage: () => {
    import('@/app/(protected)/dashboard/page');
  },

  // Wizard pages - heavy routine creation flow
  newRoutinePage: () => {
    import('@/app/(protected)/routines/new/page');
  },

  editRoutinePage: () => {
    import('@/app/(protected)/routines/edit/[id]/page');
  },

  // Wizard components - loaded dynamically during routine creation
  trainingDaysWizard: () => {
    import('@/features/routines/wizard/TrainingDays');
  },

  buildDaysWizard: () => {
    import('@/features/routines/wizard/BuildDays');
  },

  reviewCreateWizard: () => {
    import('@/features/routines/wizard/ReviewAndCreate');
  },

  // Active workout session - heavy real-time component
  activeWorkoutSession: () => {
    import('@/app/(protected)/workouts/sessions/[id]/page');
  },

  // Workout history components
  workoutHistoryPage: () => {
    import('@/app/(protected)/workouts/history/page');
  },

  workoutHistoryDetail: () => {
    import('@/app/(protected)/workouts/history/[id]/page');
  },
};

/**
 * Utility to preload all critical components
 * Call this during app initialization or idle time
 */
export const preloadAllCriticalComponents = async () => {
  const preloadPromises = Object.values(preloadComponents).map((preload) => {
    try {
      return preload();
    } catch (error) {
      console.warn('Failed to preload component:', error);
      return Promise.resolve();
    }
  });

  await Promise.allSettled(preloadPromises);
};

/**
 * Hook for intelligent component preloading based on user behavior
 */
export const useComponentPreloading = () => {
  const preloadOnHover = (componentName: keyof typeof preloadComponents) => {
    return {
      onMouseEnter: () => {
        preloadComponents[componentName]?.();
      },
      onFocus: () => {
        preloadComponents[componentName]?.();
      },
    };
  };

  const preloadOnVisible = (componentName: keyof typeof preloadComponents) => {
    return (element: HTMLElement | null) => {
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              preloadComponents[componentName]?.();
              observer.unobserve(element);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(element);
    };
  };

  return {
    preloadOnHover,
    preloadOnVisible,
    preloadAll: preloadAllCriticalComponents,
  };
};
