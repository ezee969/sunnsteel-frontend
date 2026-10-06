'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import {
	useAcceptRequest,
	useDeclineRequest,
} from '@/lib/api/hooks/useConversations'
import { useBlockMember } from '@/lib/api/hooks/useModeration'

const REQUESTS_HREF = '/messages?view=requests'

/**
 * MSG-02: what the recipient of a request does with it, in place of the
 * composer. Accepting is the region's one filled action; declining is
 * confirmed and says the sender is not told; blocking is the same `PROF-10`
 * block as a profile's, with the same explanation. A single message can also
 * be reported from its row.
 */
export function RequestPanel({
	conversationId,
	name,
	username,
	onLeave,
}: {
	conversationId: string
	/** Called before a block, so the thread stops reading what it hides. */
	onLeave: () => void
	name: string
	/** Null once the sender's account is gone: nothing to block. */
	username: string | null
}) {
	const t = useTranslations('messaging.thread')
	const tCommon = useTranslations('messaging.common')
	const tModeration = useTranslations('social.moderation')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const router = useRouter()
	const accept = useAcceptRequest()
	const decline = useDeclineRequest()
	const block = useBlockMember()
	const [confirming, setConfirming] = useState<'decline' | 'block' | null>(null)
	const busy = accept.isPending || decline.isPending || block.isPending

	const failed = (error: Error) =>
		push({
			title: t('decisionFailed'),
			description: errorText(error),
			variant: 'destructive',
		})

	return (
		<div className="space-y-3 border-t border-rule-faint pt-4">
			<p className="type-body text-foreground">
				{t('requestIncoming', { name })}
			</p>
			<p className="type-body-sm text-ink-3">
				{t('requestFollowHint', { name })}
			</p>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					disabled={busy}
					onClick={() => accept.mutate(conversationId, { onError: failed })}
				>
					{t('accept')}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={busy}
					onClick={() => setConfirming('decline')}
				>
					{t('decline')}
				</Button>
				{username ? (
					<Button
						type="button"
						variant="outline"
						disabled={busy}
						onClick={() => setConfirming('block')}
					>
						{t('block')}
					</Button>
				) : null}
			</div>

			<AlertDialog
				open={confirming !== null}
				onOpenChange={open => !open && setConfirming(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirming === 'block'
								? t('blockTitle', { name })
								: t('declineTitle')}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirming === 'block'
								? `${tModeration('blockExplanation')} ${tModeration('blockLinkCaveat')}`
								: t('declineBody', { name })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (confirming === 'block' && username) {
									onLeave()
									block.mutate(username, {
										onSuccess: () => router.push(REQUESTS_HREF),
										onError: failed,
									})
								} else {
									decline.mutate(conversationId, {
										onSuccess: () => router.push(REQUESTS_HREF),
										onError: failed,
									})
								}
							}}
						>
							{confirming === 'block' ? t('block') : t('decline')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
