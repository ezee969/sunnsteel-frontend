'use client'

import { useTranslations } from 'next-intl'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useReportBoundaryError } from '@/lib/observability/report-error'

interface RoutineEditErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function RoutineEditError({
	error,
	reset,
}: RoutineEditErrorProps) {
	// PLAT-02: reported unless it is the API refusing (a 4xx).
	useReportBoundaryError(error)
	const errorText = useApiErrorMessage()
	const t = useTranslations('routines.listing')
	const tBuilder = useTranslations('routines.builder')
	return (
		<RouteError
			title={t('editErrorTitle')}
			description={tBuilder('editErrorBody')}
			message={errorText(error)}
		>
			<Button onClick={() => reset()}>{t('retryEdit')}</Button>
			<Button
				variant="outline"
				onClick={() => (window.location.href = '/routines')}
			>
				{tBuilder('backToRoutines')}
			</Button>
		</RouteError>
	)
}
