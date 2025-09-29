# PerformanceDebugPanel Component

## Overview

The `PerformanceDebugPanel` is a development-only debugging component that provides real-time performance metrics for React Query operations. It displays query performance data, average fetch times, and detailed reports in a floating panel that can be toggled on/off during development.

## Import

```typescript
import { PerformanceDebugPanel } from '@/components/PerformanceDebugPanel';
```

## Props

This component accepts no props. All configuration is handled through environment variables.

## Environment Configuration

### Required Environment Variables

```bash
# Enable the performance panel (development only)
NODE_ENV=development
NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL=true
```

### Environment Setup

```typescript
// .env.local
NODE_ENV=development
NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL=true

// .env.production
NODE_ENV=production
# NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL is not set (panel won't show)
```

## Usage Examples

### Basic Integration

```tsx
import { PerformanceDebugPanel } from '@/components/PerformanceDebugPanel';

export function App() {
  return (
    <div className="min-h-screen">
      {/* Your app content */}
      <main>
        <YourAppContent />
      </main>
      
      {/* Performance panel - only shows in development */}
      <PerformanceDebugPanel />
    </div>
  );
}
```

### In Layout Component

```tsx
// app/layout.tsx
import { PerformanceDebugPanel } from '@/components/PerformanceDebugPanel';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <PerformanceDebugPanel />
      </body>
    </html>
  );
}
```

### With Conditional Rendering

```tsx
import { PerformanceDebugPanel } from '@/components/PerformanceDebugPanel';

export function DevelopmentTools() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) return null;
  
  return (
    <>
      <PerformanceDebugPanel />
      {/* Other development tools */}
    </>
  );
}
```

## Features

### Performance Metrics Display
- **Total Metrics Count**: Number of tracked query operations
- **Average First Fetch Time**: Mean time for initial query fetches
- **Real-time Updates**: Metrics refresh every 2 seconds when panel is visible
- **Detailed Reports**: Comprehensive performance breakdown

### Interactive Controls
- **Toggle Button**: Show/hide the performance panel
- **Metrics Counter**: Display current number of tracked metrics
- **Scrollable Content**: Handle large amounts of performance data

### Development Safety
- **Environment Gating**: Only appears in development environment
- **Production Safety**: Completely disabled in production builds
- **No Performance Impact**: Zero overhead when disabled

## Performance Hook Integration

The component integrates with the `useQueryPerformance` hook:

```typescript
// Example of the hook usage within the component
const { 
  getMetrics, 
  generateReport, 
  getAverageFirstFetch 
} = useQueryPerformance();

// Metrics are automatically collected from React Query operations
const totalMetrics = getMetrics().length;
const avgFetchTime = getAverageFirstFetch();
const detailedReport = generateReport();
```

## Styling and Customization

### Default Styling
```css
/* Toggle Button */
.toggle-button {
  background: #3b82f6; /* blue-500 */
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.75rem;
}

/* Performance Panel */
.performance-panel {
  background: rgba(0, 0, 0, 0.9);
  color: #4ade80; /* green-400 */
  padding: 1rem;
  border-radius: 0.5rem;
  max-width: 28rem;
  max-height: 24rem;
  font-family: monospace;
  font-size: 0.75rem;
}
```

### Custom Styling
```tsx
// Custom styled version
export function CustomPerformancePanel() {
  // ... component logic
  
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md font-mono text-sm transition-colors"
        onClick={() => setIsVisible(!isVisible)}
      >
        Perf ({getMetrics().length})
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-gray-900 text-cyan-400 p-4 rounded-md shadow-2xl max-w-lg max-h-80 overflow-auto font-mono text-sm">
          {/* Panel content */}
        </div>
      )}
    </div>
  );
}
```

## Data Format

### Metrics Structure
```typescript
interface PerformanceMetric {
  queryKey: string;
  fetchTime: number;
  timestamp: number;
  cacheHit: boolean;
  error?: string;
}

interface PerformanceReport {
  totalQueries: number;
  averageFetchTime: number;
  cacheHitRate: number;
  slowestQueries: PerformanceMetric[];
  recentErrors: string[];
}
```

### Sample Report Output
```
📊 Performance Metrics
Avg First Fetch: 245.67ms
Total Metrics: 23

Query Performance Report:
========================
Total Queries: 23
Cache Hit Rate: 78.3%
Average Fetch Time: 245.67ms

Slowest Queries:
- routines-list: 1,234ms
- workout-history: 892ms
- user-profile: 567ms

Recent Activity:
- [14:32:15] routines-list: 234ms ✓
- [14:32:12] user-stats: 156ms ✓
- [14:32:10] workout-data: 89ms (cached)
```

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceDebugPanel } from '@/components/PerformanceDebugPanel';

// Mock the performance hook
jest.mock('@/hooks/use-performance-query', () => ({
  useQueryPerformance: () => ({
    getMetrics: () => [{ id: 1 }, { id: 2 }],
    generateReport: () => 'Mock report data',
    getAverageFirstFetch: () => 123.45,
  }),
}));

describe('PerformanceDebugPanel', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL = 'true';
  });

  it('should render toggle button in development', () => {
    render(<PerformanceDebugPanel />);
    
    expect(screen.getByText(/Show Perf/)).toBeInTheDocument();
  });

  it('should not render in production', () => {
    process.env.NODE_ENV = 'production';
    
    render(<PerformanceDebugPanel />);
    
    expect(screen.queryByText(/Show Perf/)).not.toBeInTheDocument();
  });

  it('should toggle panel visibility', () => {
    render(<PerformanceDebugPanel />);
    
    const toggleButton = screen.getByText(/Show Perf/);
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('📊 Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Avg First Fetch: 123.45ms')).toBeInTheDocument();
  });

  it('should display metrics count', () => {
    render(<PerformanceDebugPanel />);
    
    expect(screen.getByText(/Show Perf \(2\)/)).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformanceDebugPanel } from '@/components/PerformanceDebugPanel';
import { TestComponent } from './TestComponent';

describe('PerformanceDebugPanel Integration', () => {
  it('should track query performance', async () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
        <PerformanceDebugPanel />
      </QueryClientProvider>
    );
    
    // Trigger some queries
    fireEvent.click(screen.getByText('Load Data'));
    
    // Wait for metrics to update
    await waitFor(() => {
      const toggleButton = screen.getByText(/Show Perf/);
      expect(toggleButton).toHaveTextContent('(1)');
    });
  });
});
```

## Common Patterns

### Conditional Development Tools

```tsx
// Group all development tools together
export function DevelopmentTools() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <>
      <PerformanceDebugPanel />
      <ReactQueryDevtools />
      <ReduxDevTools />
    </>
  );
}
```

### Custom Performance Tracking

```tsx
// Enhanced performance panel with custom metrics
export function EnhancedPerformancePanel() {
  const [customMetrics, setCustomMetrics] = useState([]);
  
  const trackCustomMetric = (name: string, value: number) => {
    setCustomMetrics(prev => [...prev, { name, value, timestamp: Date.now() }]);
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <PerformanceDebugPanel />
      {/* Custom metrics display */}
      <div className="mt-2 bg-blue-900 text-blue-100 p-2 rounded text-xs">
        Custom: {customMetrics.length} metrics
      </div>
    </div>
  );
}
```

### Performance Alerts

```tsx
// Alert when performance degrades
export function PerformanceMonitor() {
  const { getAverageFirstFetch } = useQueryPerformance();
  const [showAlert, setShowAlert] = useState(false);
  
  useEffect(() => {
    const avgTime = getAverageFirstFetch();
    if (avgTime > 1000) { // Alert if average > 1 second
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  }, [getAverageFirstFetch]);
  
  return (
    <>
      <PerformanceDebugPanel />
      {showAlert && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded">
          ⚠️ Slow queries detected!
        </div>
      )}
    </>
  );
}
```

## Browser Support

- **Modern Browsers**: Full support in development environments
- **Console Integration**: Works with browser developer tools
- **Mobile Development**: Responsive design for mobile debugging
- **Performance API**: Uses browser Performance API when available

## Related Components

- **useQueryPerformance**: Core performance tracking hook
- **ReactQueryDevtools**: React Query's built-in devtools
- **Development Tools**: Other debugging components
- **Performance Monitoring**: Application performance utilities

## Security Considerations

### Production Safety
- Automatically disabled in production builds
- No sensitive data exposure
- Environment variable gating
- Zero production bundle impact

### Development Security
- Only shows performance metrics, not sensitive data
- No network requests or data persistence
- Local-only debugging information
- Safe for development environments

## Migration Guide

### From Console Logging

```typescript
// Before: Manual console logging
console.log('Query performance:', queryTime);

// After: Integrated performance panel
// Metrics are automatically tracked and displayed
<PerformanceDebugPanel />
```

### From External Tools

```typescript
// Before: External performance monitoring
import { PerformanceMonitor } from 'external-lib';

// After: Built-in performance panel
import { PerformanceDebugPanel } from '@/components/PerformanceDebugPanel';
```