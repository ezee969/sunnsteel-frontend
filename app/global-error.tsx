'use client'

import { useEffect } from 'react'

import { RouteError } from '@/components/layout/RouteError'
import { buttonVariants } from '@/components/ui/button'

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		// This boundary replaces the root layout, so avoid relying on app
		// providers/logger here in case the crash originated in the layout itself.
		console.error('[app/global-error]', error)
	}, [error])

	// RouteError is plain markup - no providers, no hooks - so it is safe here.
	return (
		<html lang="es">
			<body className="bg-background text-foreground">
				<main className="ledger-page py-10 md:py-16">
					<RouteError
						title="Something went wrong"
						message={error.message || 'A critical error occurred.'}
					>
						<button onClick={() => reset()} className={buttonVariants()}>
							Try again
						</button>
					</RouteError>
				</main>
			</body>
		</html>
	)
}
