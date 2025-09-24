'use client';

import { useState, useEffect } from 'react';
import { useQueryPerformance } from '@/hooks/use-performance-query';

/**
 * Development-only performance debugging panel
 * Shows performance metrics when enabled via environment variables
 */
export function PerformanceDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<string>('');
  const { getMetrics, generateReport, getAverageFirstFetch } = useQueryPerformance();

  const shouldShow = process.env.NODE_ENV === 'development' && 
                    (process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL === 'true');

  useEffect(() => {
    if (shouldShow && isVisible) {
      const interval = setInterval(() => {
        const report = generateReport();
        setMetrics(report);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [shouldShow, isVisible, generateReport]);

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-mono hover:bg-blue-600 transition-colors"
      >
        {isVisible ? 'Hide' : 'Show'} Perf ({getMetrics().length})
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-black/90 text-green-400 p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-auto text-xs font-mono">
          <div className="mb-2 border-b border-gray-600 pb-2">
            <div>📊 Performance Metrics</div>
            <div>Avg First Fetch: {getAverageFirstFetch().toFixed(2)}ms</div>
            <div>Total Metrics: {getMetrics().length}</div>
          </div>
          <pre className="whitespace-pre-wrap text-xs">
            {metrics || 'No metrics yet...'}
          </pre>
        </div>
      )}
    </div>
  );
}