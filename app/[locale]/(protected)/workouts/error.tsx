'use client'

import { useTranslations } from 'next-intl'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'

interface WorkoutsErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function WorkoutsError({ error, reset }: WorkoutsErrorProps) {
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
