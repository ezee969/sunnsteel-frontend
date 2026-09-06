'use client'

import { useEffect } from 'react'

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
			<body className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4 bg-black text-white">
				<h2 className="text-2xl font-bold">Something went wrong</h2>
				<p className="text-sm text-white/70 max-w-md break-words">
					{error.message || 'A critical error occurred.'}
				</p>
				<button
					onClick={() => reset()}
					className="px-4 py-2 rounded-md bg-[linear-gradient(to_right,#B8860B,#8B0000)] text-white"
				>
					Try again
				</button>
			</body>
		</html>
	)
}
