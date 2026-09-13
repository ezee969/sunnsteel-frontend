'use client'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'

interface RoutinesErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function RoutinesError({ error, reset }: RoutinesErrorProps) {
	return (
		<RouteError title="Failed to load routines" message={error.message}>
			<Button onClick={() => reset()}>Retry</Button>
			<Button variant="outline" onClick={() => window.location.reload()}>
				Hard reload
			</Button>
		</RouteError>
	)
}
