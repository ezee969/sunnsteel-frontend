'use client'

import { Button } from '@/components/ui/button'

interface WorkoutSessionErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function WorkoutSessionError({
	error,
	reset,
}: WorkoutSessionErrorProps) {
	return (
		<div className="p-6 space-y-4 max-w-xl mx-auto">
			<div className="space-y-2">
				<h2 className="type-section text-foreground">Workout Session Error</h2>
				<p className="text-sm text-muted-foreground">
					Something went wrong with your workout session. Your progress should
					be saved.
				</p>
			</div>

			<div className="bg-surface-sunk p-3">
				<p className="type-data break-all text-ink-2">{error.message}</p>
			</div>

			<div className="flex gap-3">
				<Button onClick={() => reset()}>Retry Session</Button>
				<Button
					variant="outline"
					onClick={() => (window.location.href = '/workouts')}
				>
					Back to Workouts
				</Button>
			</div>
		</div>
	)
}
