'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { logger } from '@/lib/utils/logger'

export default function RootError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('core.appError')

	useEffect(() => {
		logger.error('[app/error]', error)
	}, [error])

	// Replaces every layout below the root, so it brings its own page grid.
	return (
		<main className="ledger-page py-10 md:py-16">
			<RouteError
				title={t('title')}
				message={errorText(error) || t('fallbackMessage')}
			>
				<Button onClick={() => reset()}>{t('tryAgain')}</Button>
				<Button variant="outline" onClick={() => window.location.assign('/')}>
					{t('goHome')}
				</Button>
			</RouteError>
		</main>
	)
}
