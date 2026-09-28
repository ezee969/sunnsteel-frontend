'use client'

import { RouteError } from '@/components/layout/RouteError'
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
		<RouteError
			title="Edit Routine Error"
			description="Failed to load or save routine changes. Your data should be preserved."
			message={error.message}
		>
			<Button onClick={() => reset()}>Retry Edit</Button>
			<Button
				variant="outline"
				onClick={() => (window.location.href = '/routines')}
			>
				Back to Routines
			</Button>
		</RouteError>
	)
}
