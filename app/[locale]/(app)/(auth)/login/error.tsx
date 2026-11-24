'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import { useReportBoundaryError } from '@/lib/observability/report-error'
import { logger } from '@/lib/utils/logger'

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	// PLAT-02: reported unless it is the API refusing (a 4xx).
	useReportBoundaryError(error)
	const t = useTranslations('core.authError')

	useEffect(() => {
		logger.error(error)
	}, [error])

	// The signed-out shell supplies <main> and the form column.
	return (
		<RouteError title={t('title')}>
			<Button onClick={reset}>{t('tryAgain')}</Button>
		</RouteError>
	)
}
