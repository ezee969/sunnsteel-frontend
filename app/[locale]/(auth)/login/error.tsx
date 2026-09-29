'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
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
