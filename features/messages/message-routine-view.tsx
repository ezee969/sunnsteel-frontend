'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CloneSharedRoutine } from '@/features/routines/components/CloneSharedRoutine'
import { SharedRoutineView } from '@/features/routines/components/SharedRoutineView'
import { useMessageRoutine } from '@/lib/api/hooks/useConversations'
import { useUser } from '@/lib/api/hooks/useUser'
import { HttpError } from '@/lib/api/services/httpClient'
import { describeSharedRoutineOwner } from '@/lib/utils/routine-sharing'

/**
 * MSG-07: the routine a message shared, opened from its card. Sending it was
 * the sender's consent, so the other participant reads it whatever its
 * visibility and may copy it, until the message is deleted; the read answers
 * 404 for anything else, and this page cannot tell which. The sender opening
 * their own sees it as it is now, with a way to their routine instead of a
 * copy of it.
 */
export function MessageRoutineView({
	conversationId,
	messageId,
}: {
	conversationId: string
	messageId: string
}) {
	const t = useTranslations('messaging.routine')
	const { data, error, isLoading, refetch } = useMessageRoutine(
		conversationId,
		messageId,
	)
	const { user } = useUser()

	const back = (
		<Link
			href={`/messages/${encodeURIComponent(conversationId)}`}
			className="type-body-sm inline-flex items-center gap-1 self-start text-ink-2 underline-offset-4 hover:text-foreground hover:underline"
		>
			<ArrowLeft className="size-4" aria-hidden />
			{t('back')}
		</Link>
	)

	if (isLoading) {
		return (
			<div className="space-y-6" aria-busy="true" aria-label={t('loading')}>
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-4 w-1/3" />
				<Skeleton className="h-24 w-full" />
			</div>
		)
	}

	if (!data) {
		const isGone = error instanceof HttpError && error.status === 404
		return (
			<div className="flex flex-col gap-3">
				{back}
				<div role="alert" className="space-y-1">
					<h1 className="type-section text-foreground">
						{isGone ? t('unavailable') : t('loadError')}
					</h1>
					{isGone ? (
						<p className="type-body-sm max-w-[68ch] text-ink-3">
							{t('unavailableHint')}
						</p>
					) : (
						<Button type="button" variant="outline" onClick={() => refetch()}>
							{t('tryAgain')}
						</Button>
					)}
				</div>
			</div>
		)
	}

	const mine = !!user?.username && user.username === data.owner.username

	return (
		<div className="flex flex-col gap-8">
			{back}
			<p className="type-body-sm max-w-[68ch] text-ink-2">
				{mine
					? t('yours')
					: t('sentToYou', { name: describeSharedRoutineOwner(data) })}
			</p>
			<SharedRoutineView routine={data} />
			{mine ? (
				<Button asChild variant="outline" className="self-start">
					<Link href={`/routines/${encodeURIComponent(data.routineId)}`}>
						{t('openYours')}
					</Link>
				</Button>
			) : (
				<CloneSharedRoutine
					source={{ messageId }}
					routineName={data.setup.name}
				/>
			)}
		</div>
	)
}
