'use client'

import { useTranslations } from 'next-intl'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'

interface RoutineEditErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function RoutineEditError({
	error,
	reset,
}: RoutineEditErrorProps) {
	const t = useTranslations('routines.listing')
	const tBuilder = useTranslations('routines.builder')
	return (
		<RouteError
			title={t('editErrorTitle')}
			description={tBuilder('editErrorBody')}
			message={error.message}
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
