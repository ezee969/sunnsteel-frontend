# ADR-0002: State Management with React Query

## Status
Accepted

## Context

The Sunsteel Frontend application requires robust state management for handling server state, client state, and data synchronization. The application deals with complex data flows including:

- User authentication and session management
- Routine and workout data from the backend API
- Real-time updates and optimistic UI updates
- Caching and background synchronization
- Error handling and retry logic
- Loading states and data fetching

The team needed to choose a state management solution that could handle both server state and client state effectively while providing excellent developer experience and performance.

## Decision

We decided to adopt **TanStack Query (React Query) v5.85.3** as the primary state management solution for server state, combined with **React Context** for global client state and **local component state** for component-specific data.

### State Management Architecture:

1. **Server State**: React Query for API data, caching, and synchronization
2. **Global Client State**: React Context for theme, sidebar, and app-wide UI state
3. **Local State**: useState/useReducer for component-specific state
4. **Form State**: React Hook Form for form data management
5. **URL State**: Next.js router for route and query parameters

### Key Features Utilized:
- **Automatic Caching**: Intelligent caching with stale-while-revalidate
- **Background Updates**: Automatic refetching and synchronization
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **Error Handling**: Built-in retry logic and error boundaries
- **Loading States**: Automatic loading and error state management
- **Infinite Queries**: Pagination and infinite scrolling support
- **Mutations**: Create, update, delete operations with cache invalidation

## Consequences

### Positive Consequences:

1. **Simplified Data Fetching**: Declarative data fetching with automatic caching
2. **Performance**: Intelligent caching reduces unnecessary network requests
3. **User Experience**: Background updates and optimistic UI provide smooth interactions
4. **Developer Experience**: Excellent TypeScript support and DevTools
5. **Error Handling**: Built-in retry logic and error state management
6. **Consistency**: Automatic cache synchronization across components
7. **Offline Support**: Cache-first approach works well offline
8. **Bundle Size**: Relatively small footprint for the features provided

### Negative Consequences:

1. **Learning Curve**: Team needs to learn React Query patterns and concepts
2. **Complexity**: Query key management and cache invalidation require careful planning
3. **Over-fetching**: May fetch data that's not immediately needed
4. **Memory Usage**: Caching can increase memory consumption
5. **Debugging**: Cache behavior can sometimes be difficult to debug

### Migration Considerations:
- Existing API calls needed to be wrapped in React Query hooks
- Cache invalidation strategies needed to be implemented
- Error handling patterns needed to be updated

## Alternatives Considered

### 1. Redux Toolkit + RTK Query
**Pros:**
- Mature ecosystem with extensive tooling
- Predictable state updates with reducers
- Time-travel debugging with Redux DevTools
- Strong TypeScript support
- RTK Query provides similar caching features

**Cons:**
- More boilerplate code required
- Steeper learning curve for new developers
- Larger bundle size
- More complex setup for simple use cases
- Over-engineering for server state management

**Rejection Reason:** React Query provides better developer experience for server state management with less boilerplate, while Redux's complexity wasn't justified for our use case.

### 2. SWR
**Pros:**
- Lightweight and simple API
- Good caching and revalidation features
- Smaller bundle size than React Query
- Good TypeScript support
- Similar stale-while-revalidate approach

**Cons:**
- Less feature-rich than React Query
- Fewer optimization options
- Limited mutation support
- Smaller ecosystem and community
- Less sophisticated error handling

**Rejection Reason:** React Query provides more comprehensive features for complex applications, including better mutation support and more advanced caching strategies.

### 3. Apollo Client (with GraphQL)
**Pros:**
- Excellent GraphQL integration
- Sophisticated caching with normalized cache
- Real-time subscriptions support
- Strong TypeScript code generation
- Mature ecosystem

**Cons:**
- Requires GraphQL backend (we use REST)
- Large bundle size
- Complex setup and configuration
- Over-engineered for REST APIs
- Steep learning curve

**Rejection Reason:** Our backend uses REST APIs, making Apollo Client's GraphQL-specific features unnecessary overhead.

### 4. Zustand + Custom Data Fetching
**Pros:**
- Minimal boilerplate
- Small bundle size
- Simple API
- Good TypeScript support
- Flexible state management

**Cons:**
- No built-in caching or data fetching features
- Manual implementation of loading states and error handling
- No automatic background updates
- Requires custom implementation of optimistic updates
- Less sophisticated than specialized data fetching libraries

**Rejection Reason:** While Zustand is excellent for client state, it lacks the specialized features needed for server state management.

## Implementation Details

### Query Client Configuration
```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false // Don't retry 4xx errors
        }
        return failureCount < 3
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
})
```

### Query Hook Pattern
```typescript
// lib/api/hooks/useRoutines.ts
export const useRoutines = (filters?: RoutineFilters) => {
  const filterKey = serializeFilters(filters)
  
  return useQuery({
    queryKey: ['routines', filterKey],
    queryFn: () => routineService.getUserRoutines(filters),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.sort((a, b) => a.name.localeCompare(b.name))
  })
}

export const useRoutine = (id: string) => {
  return useQuery({
    queryKey: ['routines', 'detail', id],
    queryFn: () => routineService.getRoutineById(id),
    enabled: !!id
  })
}
```

### Mutation Hook Pattern
```typescript
// lib/api/hooks/useRoutineMutations.ts
export const useRoutineMutations = () => {
  const queryClient = useQueryClient()
  
  const createRoutine = useMutation({
    mutationFn: routineService.createRoutine,
    onSuccess: (newRoutine) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      queryClient.setQueryData(['routines', 'detail', newRoutine.id], newRoutine)
      toast.success('Routine created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create routine')
      console.error('Create routine error:', error)
    }
  })
  
  const updateRoutine = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Routine> }) =>
      routineService.updateRoutine(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['routines', 'detail', id] })
      
      const previousRoutine = queryClient.getQueryData(['routines', 'detail', id])
      
      queryClient.setQueryData(['routines', 'detail', id], (old: Routine) => ({
        ...old,
        ...data
      }))
      
      return { previousRoutine }
    },
    onError: (err, variables, context) => {
      if (context?.previousRoutine) {
        queryClient.setQueryData(
          ['routines', 'detail', variables.id],
          context.previousRoutine
        )
      }
      toast.error('Failed to update routine')
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routines', 'detail', variables.id] })
    }
  })
  
  return {
    createRoutine,
    updateRoutine,
    isCreating: createRoutine.isPending,
    isUpdating: updateRoutine.isPending
  }
}
```

### Query Key Management
```typescript
// lib/api/query-keys.ts
export const queryKeys = {
  routines: {
    all: ['routines'] as const,
    lists: () => [...queryKeys.routines.all, 'list'] as const,
    list: (filters: RoutineFilters) => 
      [...queryKeys.routines.lists(), serializeFilters(filters)] as const,
    details: () => [...queryKeys.routines.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.routines.details(), id] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    lists: () => [...queryKeys.workouts.all, 'list'] as const,
    list: (routineId: string) => 
      [...queryKeys.workouts.lists(), routineId] as const,
  }
} as const
```

### Provider Setup
```typescript
// app/layout.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig))
  
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

### Error Handling Integration
```typescript
// hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          toast.error('Please log in to continue')
          // Handle authentication error
          break
        case 403:
          toast.error('You don\'t have permission to perform this action')
          break
        case 404:
          toast.error('The requested resource was not found')
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          toast.error('An unexpected error occurred')
      }
    } else {
      toast.error('An unexpected error occurred')
      console.error('Unexpected error:', error)
    }
  }, [])
  
  return { handleError }
}
```

## Performance Considerations

### Cache Optimization
- **Stale Time**: 5 minutes for most queries to balance freshness and performance
- **Cache Time**: 10 minutes to keep data available for quick navigation
- **Background Refetching**: Automatic updates when window regains focus
- **Query Deduplication**: Automatic deduplication of identical requests

### Bundle Size Impact
- React Query adds ~13KB gzipped to the bundle
- DevTools are excluded from production builds
- Tree-shaking eliminates unused features

### Memory Management
- Automatic garbage collection of unused cache entries
- Configurable cache time limits
- Manual cache clearing for memory-sensitive operations

## Testing Strategy

### Query Testing
```typescript
// test/hooks/useRoutines.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRoutines } from '@/lib/api/hooks/useRoutines'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useRoutines', () => {
  it('should fetch routines successfully', async () => {
    const { result } = renderHook(() => useRoutines(), {
      wrapper: createWrapper()
    })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toBeDefined()
  })
})
```

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Caching Strategies](https://tanstack.com/query/latest/docs/react/guides/caching)
- [Error Handling](https://tanstack.com/query/latest/docs/react/guides/query-retries)

## Related ADRs

- [ADR-0001: Next.js App Router Architecture](./adr-0001-nextjs-app-router.md)
- [ADR-0003: Supabase Authentication Integration](./adr-0003-supabase-authentication.md)
- [ADR-0006: Form Handling with React Hook Form](./adr-0006-react-hook-form.md)