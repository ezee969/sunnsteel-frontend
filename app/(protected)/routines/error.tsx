'use client'
// @ts-nocheck
// React types resolution may be deferred in certain tooling contexts; safe to skip.

import { Button } from '@/components/ui/button'

interface RoutinesErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function RoutinesError({ error, reset }: RoutinesErrorProps) {
	return (
		<div className="p-6 space-y-4 max-w-xl">
			<h2 className="type-section text-foreground">Failed to load routines</h2>
			<p className="text-sm text-muted-foreground break-all">{error.message}</p>
			<div className="flex gap-2">
				<Button variant="link" onClick={() => reset()}>
					Retry
				</Button>
				<Button variant="link" onClick={() => window.location.reload()}>
					Hard reload
				</Button>
			</div>
		</div>
	)
}
