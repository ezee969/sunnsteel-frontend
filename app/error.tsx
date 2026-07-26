'use client'

import { useEffect } from 'react'

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

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
			<h2 className="text-2xl font-bold">Something went wrong</h2>
			<p className="text-sm text-muted-foreground max-w-md break-words">
				{error.message || 'An unexpected error occurred.'}
			</p>
			<div className="flex gap-2">
				<Button variant="classical" onClick={() => reset()}>
					Try again
				</Button>
				<Button variant="outline" onClick={() => window.location.assign('/')}>
					Go home
				</Button>
			</div>
		</div>
	)
}
