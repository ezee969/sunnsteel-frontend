'use client'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'

interface WorkoutsErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function WorkoutsError({ error, reset }: WorkoutsErrorProps) {
	return (
		<RouteError title="Failed to load workouts" message={error.message}>
			<Button onClick={() => reset()}>Retry</Button>
			<Button variant="outline" onClick={() => window.location.reload()}>
				Hard reload
			</Button>
		</RouteError>
	)
}
