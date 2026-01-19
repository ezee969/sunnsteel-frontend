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
						staleTime: 5 * 60 * 1000, // 5 minutes - longer cache for better navigation performance
						refetchOnWindowFocus: false,
						refetchOnMount: 'always', // Always refetch on mount for fresh data
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
