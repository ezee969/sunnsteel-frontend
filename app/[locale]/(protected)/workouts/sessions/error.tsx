'use client'

import { RouteError } from '@/components/layout/RouteError'
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
		<RouteError
			title="Workout Session Error"
			description="Something went wrong with your workout session. Your progress should be saved."
			message={error.message}
		>
			<Button onClick={() => reset()}>Retry Session</Button>
			<Button
				variant="outline"
				onClick={() => (window.location.href = '/workouts')}
			>
				Back to Workouts
			</Button>
		</RouteError>
	)
}
