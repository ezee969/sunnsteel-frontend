'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SharedSessionView } from '@/features/workout/shared-session-view'
import { useSharedSession } from '@/lib/api/hooks/useSessionShares'
import { HttpError } from '@/lib/api/services/httpClient'

export default function SharedSessionPage() {
	const t = useTranslations('core.sharedSession')

	const params = useParams<{ token: string }>()
	const token = params?.token || ''
	const { data, error, isLoading, refetch } = useSharedSession(token)

	if (isLoading) {
		return (
			<div
				className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12"
				aria-busy="true"
				aria-label={t('loadingLabel')}
			>
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-4 w-1/3" />
				<Skeleton className="h-24 w-full" />
			</div>
		)
	}

	if (!data) {
		const isGone = error instanceof HttpError && error.status === 404
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
				<h1 className="type-section text-foreground">
					{isGone ? t('linkGoneTitle') : t('loadErrorTitle')}
				</h1>
				<p className="type-body-sm max-w-md text-ink-3">
					{isGone ? t('linkGoneDescription') : t('loadErrorDescription')}
				</p>
				{!isGone && (
					<Button variant="outline" onClick={() => refetch()}>
						{t('tryAgain')}
					</Button>
				)}
			</div>
		)
	}

	return <SharedSessionView shared={data} />
}
