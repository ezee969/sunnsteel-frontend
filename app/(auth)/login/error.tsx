'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		logger.error(error)
	}, [error])

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
			<h2 className="type-section mb-4 text-foreground">
				Something went wrong!
			</h2>
			<Button onClick={reset}>Try again</Button>
		</div>
	)
}
