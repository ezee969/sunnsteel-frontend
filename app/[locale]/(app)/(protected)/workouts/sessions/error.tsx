'use client'

import { useTranslations } from 'next-intl'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useReportBoundaryError } from '@/lib/observability/report-error'

interface WorkoutSessionErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function WorkoutSessionError({
	error,
	reset,
}: WorkoutSessionErrorProps) {
	// PLAT-02: reported unless it is the API refusing (a 4xx).
	useReportBoundaryError(error)
	const errorText = useApiErrorMessage()
	const t = useTranslations('workout.errors')
	return (
		<RouteError
			title={t('sessionErrorTitle')}
			description={t('sessionErrorDescription')}
			message={errorText(error)}
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
