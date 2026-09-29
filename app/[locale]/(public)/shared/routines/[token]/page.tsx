'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CloneSharedRoutine } from '@/features/routines/components/CloneSharedRoutine'
import { SharedRoutineView } from '@/features/routines/components/SharedRoutineView'
import { useSharedRoutine } from '@/lib/api/hooks/useRoutineSharing'
import { HttpError } from '@/lib/api/services/httpClient'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export default function SharedRoutinePage() {
	const t = useTranslations('core.sharedRoutine')

	const params = useParams<{ token: string }>()
	const token = params?.token || ''
	const { session } = useSupabaseAuth()
	const { data, error, isLoading, refetch } = useSharedRoutine(token)

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
		// A revoked link and one that never existed are the same answer on
		// purpose: neither should confirm that a routine is there.
		const isGone = error instanceof HttpError && error.status === 404
		return (
			<div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-8 sm:px-6 sm:py-12">
				<h1 className="type-section text-foreground">
					{isGone ? t('linkGoneTitle') : t('unavailableTitle')}
				</h1>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{isGone ? t('linkGoneDescription') : t('unavailableDescription')}
				</p>
				{!isGone ? (
					<Button type="button" variant="outline" onClick={() => refetch()}>
						{t('tryAgain')}
					</Button>
				) : null}
			</div>
		)
	}

	return (
		<div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
			<SharedRoutineView routine={data} />
			{session ? (
				<CloneSharedRoutine source={{ token }} routineName={data.setup.name} />
			) : (
				// ROUT-05 needs an account to own the copy, so the offer is a
				// sign-in that comes back here rather than a button that fails.
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					<Link
						href={`/login?redirectTo=/shared/routines/${token}`}
						className="text-primary underline-offset-4 hover:underline"
					>
						{t('signInLinkLabel')}
					</Link>{' '}
					{t('signInToSaveSuffix')}
				</p>
			)}
		</div>
	)
}
