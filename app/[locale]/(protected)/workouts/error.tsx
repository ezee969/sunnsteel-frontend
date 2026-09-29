'use client'

import { useTranslations } from 'next-intl'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'

interface WorkoutsErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function WorkoutsError({ error, reset }: WorkoutsErrorProps) {
	const t = useTranslations('workout.errors')
	return (
		<RouteError title={t('workoutsFailedTitle')} message={error.message}>
			<Button onClick={() => reset()}>{t('retry')}</Button>
			<Button variant="outline" onClick={() => window.location.reload()}>
				{t('hardReload')}
			</Button>
		</RouteError>
	)
}
