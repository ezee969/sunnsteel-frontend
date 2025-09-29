# Custom Hooks

Brief documentation for custom React hooks used throughout the application.

## Authentication & Security

### useAuthProtection
Route protection and authentication state management.

```typescript
import { useAuthProtection } from '@/hooks/use-auth-protection';

function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuthProtection();
  // Automatically redirects if not authenticated
}
```

## Performance & Optimization

### useDebounce
Debounce values to prevent excessive API calls or computations.

```typescript
import { useDebounce } from '@/hooks/use-debounce';

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  // Use debouncedQuery for API calls
}
```

### useNavigationPrefetch
Prefetch routes and components for improved navigation performance.

```typescript
import { useNavigationPrefetch } from '@/hooks/use-navigation-prefetch';

function NavigationLink({ href }: { href: string }) {
  const { prefetchRoute } = useNavigationPrefetch();
  
  return (
    <Link 
      href={href}
      onMouseEnter={() => prefetchRoute(href)}
    >
      Navigate
    </Link>
  );
}
```

### usePerformanceQuery
Enhanced React Query with performance monitoring and debugging.

```typescript
import { usePerformanceQuery } from '@/hooks/use-performance-query';

function DataComponent() {
  const { data, isLoading, performanceMetrics } = usePerformanceQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });
  // Includes performance tracking and debugging info
}
```

## UI & Layout

### useSidebar
Sidebar state management for responsive navigation.

```typescript
import { useSidebar } from '@/hooks/use-sidebar';

function Layout() {
  const { isOpen, toggle, close } = useSidebar();
  
  return (
    <div>
      <Sidebar isOpen={isOpen} onClose={close} />
      <button onClick={toggle}>Toggle Sidebar</button>
    </div>
  );
}
```

## Workout & Training

### useBasicHypertrophyCompletion
Completion logic for basic hypertrophy training programs.

```typescript
import { useBasicHypertrophyCompletion } from '@/hooks/useBasicHypertrophyCompletion';

function HypertrophyWorkout({ routine }: { routine: Routine }) {
  const { completeSet, isSetComplete, progress } = useBasicHypertrophyCompletion(routine);
  // Handles set completion and progress tracking
}
```

### useRepsToFailureCompletion
Completion logic for reps-to-failure (RTF) training programs.

```typescript
import { useRepsToFailureCompletion } from '@/hooks/useRepsToFailureCompletion';

function RtfWorkout({ routine }: { routine: Routine }) {
  const { completeAmrapSet, calculateProgress, adjustTrainingMax } = useRepsToFailureCompletion(routine);
  // Handles RTF-specific completion logic and TM adjustments
}
```

## Usage Patterns

### Hook Composition
```typescript
// Combine multiple hooks for complex functionality
function WorkoutSession() {
  const { isAuthenticated } = useAuthProtection();
  const { isOpen, toggle } = useSidebar();
  const debouncedWeight = useDebounce(weight, 500);
  
  // Component logic
}
```

### Performance Optimization
```typescript
// Use debouncing for expensive operations
const debouncedSearch = useDebounce(searchTerm, 300);
const { data } = usePerformanceQuery({
  queryKey: ['search', debouncedSearch],
  queryFn: () => searchAPI(debouncedSearch),
  enabled: !!debouncedSearch,
});
```

### Navigation Enhancement
```typescript
// Prefetch routes for better UX
const { prefetchRoute } = useNavigationPrefetch();

useEffect(() => {
  // Prefetch likely next routes
  prefetchRoute('/routines');
  prefetchRoute('/dashboard');
}, []);
```

## Testing

### Hook Testing
```typescript
import { renderHook } from '@testing-library/react';
import { useDebounce } from '@/hooks/use-debounce';

test('should debounce value changes', () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 100 } }
  );
  
  expect(result.current).toBe('initial');
});
```

## Related Documentation
- [API Hooks](../api/README.md) - Server state management hooks
- [Components](../components/README.md) - Component documentation
- [Architecture](../architecture/README.md) - System architecture### useRtFWeekGoals

Signature: (routineId: string, week?: number)

Usage:
`	s
const { data } = useRtFWeekGoals(
  isRtf && routineId ? routineId : '',
  isRtf && currentWeek ? currentWeek : undefined
);
`

Notes:
- Pass empty string/undefined to prevent fetch when conditions arent met.
- Internal logic handles enabled state; do not pass a third options parameter.
- Hook uses ETag-aware client with React Query caching.
