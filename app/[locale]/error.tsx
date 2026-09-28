'use client'

import { useEffect } from 'react'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

export default function RootError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		logger.error('[app/error]', error)
	}, [error])

	// Replaces every layout below the root, so it brings its own page grid.
	return (
		<main className="ledger-page py-10 md:py-16">
			<RouteError
				title="Something went wrong"
				message={error.message || 'An unexpected error occurred.'}
			>
				<Button onClick={() => reset()}>Try again</Button>
				<Button variant="outline" onClick={() => window.location.assign('/')}>
					Go home
				</Button>
			</RouteError>
		</main>
	)
}
