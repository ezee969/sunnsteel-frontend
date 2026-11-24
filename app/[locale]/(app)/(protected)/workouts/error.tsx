'use client'

import { useTranslations } from 'next-intl'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useReportBoundaryError } from '@/lib/observability/report-error'

interface WorkoutsErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function WorkoutsError({ error, reset }: WorkoutsErrorProps) {
	// PLAT-02: reported unless it is the API refusing (a 4xx).
	useReportBoundaryError(error)
	const errorText = useApiErrorMessage()
	const t = useTranslations('workout.errors')
	return (
		<RouteError title={t('workoutsFailedTitle')} message={errorText(error)}>
			<Button onClick={() => reset()}>{t('retry')}</Button>
			<Button variant="outline" onClick={() => window.location.reload()}>
				{t('hardReload')}
			</Button>
		</RouteError>
	)
}
