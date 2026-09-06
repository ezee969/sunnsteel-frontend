'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
	// Create a new QueryClient instance for each session
	// This prevents sharing query cache between users/tabs
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000,
						refetchOnWindowFocus: false,
						// `true`, not `'always'`. Every protected page is a client
						// component that remounts on navigation, so `'always'` refetched
						// every query on every navigation and made `staleTime` above
						// purely decorative. With `true`, a query that is still fresh is
						// served from cache and navigation stops touching the network.
						// Queries that must not serve stale data opt out with their own
						// `staleTime: 0` — see `useSession` in useWorkoutSession.ts.
						// TD-02.
						refetchOnMount: true,
						refetchOnReconnect: true,
						retry: (failureCount, error: unknown) => {
							const status =
								typeof error === 'object' && error !== null && 'status' in error
									? (error as { status?: number }).status
									: undefined
							if (typeof status === 'number' && status >= 400 && status < 500)
								return false
							return failureCount < 3
						},
						retryDelay: attemptIndex =>
							Math.min(1000 * 2 ** attemptIndex, 30000),
						// Enable background refetching for better UX
						refetchInterval: false, // We'll use manual prefetching instead
						// Keep data fresh while navigating
						gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
					},
					mutations: {
						retry: (failureCount, error: unknown) => {
							const status =
								typeof error === 'object' && error !== null && 'status' in error
									? (error as { status?: number }).status
									: undefined
							if (typeof status === 'number' && status >= 400 && status < 500)
								return false
							return failureCount < 2 // Only retry mutations once
						},
						retryDelay: 1000,
					},
				},
			}),
	)

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{/* <ReactQueryDevtools initialIsOpen={false} /> */}
		</QueryClientProvider>
	)
}
