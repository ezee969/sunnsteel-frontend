'use client'

import { useEffect } from 'react'

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

	return (
		<html lang="es">
			<body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
				<h2 className="type-section text-foreground">Something went wrong</h2>
				<p className="type-body-sm max-w-md break-words text-ink-2">
					{error.message || 'A critical error occurred.'}
				</p>
				<button onClick={() => reset()} className={buttonVariants()}>
					Try again
				</button>
			</body>
		</html>
	)
}
