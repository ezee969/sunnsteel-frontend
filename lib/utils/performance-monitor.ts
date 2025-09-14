'use client';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'navigation' | 'prefetch' | 'cache' | 'component';
}

// Type definitions for Web Performance APIs
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private navigationStart: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
    }
  }

  private initializeWebVitals() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          startTime: number;
        };
        this.recordMetric('LCP', lastEntry.startTime, 'navigation');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          this.recordMetric(
            'FID',
            fidEntry.processingStart - fidEntry.startTime,
            'navigation'
          );
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as LayoutShift;
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
          }
        });
        this.recordMetric('CLS', clsValue, 'navigation');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('Navigation', navEntry.duration, 'navigation');
          this.recordMetric(
            'DOM Content Loaded',
            navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            'navigation'
          );
          this.recordMetric(
            'Load Complete',
            navEntry.loadEventEnd - navEntry.loadEventStart,
            'navigation'
          );
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  recordMetric(name: string, value: number, type: PerformanceMetric['type']) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log significant metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [Performance] ${name}: ${value.toFixed(2)}ms`);
    }
  }

  startNavigation(route: string) {
    this.navigationStart = performance.now();
    this.recordMetric(`Navigation Start: ${route}`, 0, 'navigation');
  }

  endNavigation(route: string) {
    if (this.navigationStart > 0) {
      const duration = performance.now() - this.navigationStart;
      this.recordMetric(`Navigation Complete: ${route}`, duration, 'navigation');
      this.navigationStart = 0;
    }
  }

  recordPrefetch(resource: string, duration: number) {
    this.recordMetric(`Prefetch: ${resource}`, duration, 'prefetch');
  }

  recordCacheHit(resource: string) {
    this.recordMetric(`Cache Hit: ${resource}`, 0, 'cache');
  }

  recordComponentLoad(component: string, duration: number) {
    this.recordMetric(`Component Load: ${component}`, duration, 'component');
  }

  getMetrics(type?: PerformanceMetric['type']): PerformanceMetric[] {
    if (type) {
      return this.metrics.filter((m) => m.type === type);
    }
    return [...this.metrics];
  }

  getAverageMetric(name: string): number {
    const relevantMetrics = this.metrics.filter((m) => m.name === name);
    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  generateReport(): string {
    const report = {
      navigation: this.getMetrics('navigation'),
      prefetch: this.getMetrics('prefetch'),
      cache: this.getMetrics('cache'),
      component: this.getMetrics('component'),
      averages: {
        lcp: this.getAverageMetric('LCP'),
        fid: this.getAverageMetric('FID'),
        cls: this.getAverageMetric('CLS'),
        navigation: this.getAverageMetric('Navigation'),
      },
    };

    return JSON.stringify(report, null, 2);
  }

  clear() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    startNavigation: performanceMonitor.startNavigation.bind(performanceMonitor),
    endNavigation: performanceMonitor.endNavigation.bind(performanceMonitor),
    recordPrefetch: performanceMonitor.recordPrefetch.bind(performanceMonitor),
    recordCacheHit: performanceMonitor.recordCacheHit.bind(performanceMonitor),
    recordComponentLoad:
      performanceMonitor.recordComponentLoad.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getAverageMetric: performanceMonitor.getAverageMetric.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
  };
};

// Utility functions for measuring performance
export const measureAsync = async <T>(
  operation: () => Promise<T>,
  name: string,
  type: PerformanceMetric['type'] = 'component'
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration, type);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`${name} (Error)`, duration, type);
    throw error;
  }
};

export const measureSync = <T>(
  operation: () => T,
  name: string,
  type: PerformanceMetric['type'] = 'component'
): T => {
  const start = performance.now();
  try {
    const result = operation();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration, type);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`${name} (Error)`, duration, type);
    throw error;
  }
};
