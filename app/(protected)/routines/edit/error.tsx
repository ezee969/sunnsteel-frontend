'use client'

import { Button } from '@/components/ui/button'

interface RoutineEditErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function RoutineEditError({
	error,
	reset,
}: RoutineEditErrorProps) {
	return (
		<div className="p-6 space-y-4 max-w-xl mx-auto">
			<div className="space-y-2">
				<h2 className="type-section text-foreground">Edit Routine Error</h2>
				<p className="text-sm text-muted-foreground">
					Failed to load or save routine changes. Your data should be preserved.
				</p>
			</div>

			<div className="bg-surface-sunk p-3">
				<p className="type-data break-all text-ink-2">{error.message}</p>
			</div>

			<div className="flex gap-3">
				<Button onClick={() => reset()}>Retry Edit</Button>
				<Button
					variant="outline"
					onClick={() => (window.location.href = '/routines')}
				>
					Back to Routines
				</Button>
			</div>
		</div>
	)
}
