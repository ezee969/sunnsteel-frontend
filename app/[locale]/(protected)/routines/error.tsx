'use client'

import { useTranslations } from 'next-intl'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'

interface RoutinesErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function RoutinesError({ error, reset }: RoutinesErrorProps) {
	const t = useTranslations('routines.listing')
	return (
		<RouteError title={t('loadFailed')} message={error.message}>
			<Button onClick={() => reset()}>{t('retry')}</Button>
			<Button variant="outline" onClick={() => window.location.reload()}>
				Hard reload
			</Button>
		</RouteError>
	)
}
