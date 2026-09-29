'use client'

import { useTranslations } from 'next-intl'

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
	const t = useTranslations('workout.errors')
	return (
		<RouteError
			title={t('sessionErrorTitle')}
			description={t('sessionErrorDescription')}
			message={error.message}
		>
			<Button onClick={() => reset()}>{t('retrySession')}</Button>
			<Button
				variant="outline"
				onClick={() => (window.location.href = '/workouts')}
			>
				{t('backToWorkouts')}
			</Button>
		</RouteError>
	)
}
