'use client'

import type { ConversationBox } from '@sunsteel/contracts'
import { Ban, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { useConversations } from '@/lib/api/hooks/useConversations'
import { formatTimeAgo } from '@/lib/utils/date'
import { conversationPreview, memberName } from '@/lib/utils/messages'

import { MemberAvatar } from './member-avatar'

/**
 * MSG-01: the member's conversations, newest activity first, as a §11.5
 * ruled list. A row is one link to its thread; the other member's name, a
 * one-line preview and when it last moved. MSG-03: a conversation with
 * something new says "New" before its time, as an unread notification does.
 */
export function ConversationList({
	box = 'INBOX',
}: {
	/** MSG-02: the inbox, or the requests waiting for the member. */
	box?: ConversationBox
}) {
	const t = useTranslations('messaging.list')
	const tCommon = useTranslations('messaging.common')
	const tEx = useTranslations('catalog.exercises')
	const locale = useLocale() as Locale
	const errorText = useApiErrorMessage()
	const conversations = useConversations(box)

	if (conversations.isPending) {
		return (
			<div aria-busy="true" aria-label={t('loading')}>
				{[0, 1, 2].map(index => (
					<div key={index} className="rule-row flex items-center gap-3 py-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-3 w-64 max-w-full" />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (conversations.isError) {
		return (
			<div role="alert" className="space-y-2 py-4">
				<p className="type-body-sm text-destructive">{t('loadError')}</p>
				<p className="type-body-sm text-ink-3">
					{errorText(conversations.error)}
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => void conversations.refetch()}
				>
					{tCommon('tryAgain')}
				</Button>
			</div>
		)
	}

	const rows = conversations.data?.conversations ?? []
	// MSG-09: said once, above the list, to the member it is about.
	const restricted = conversations.data?.messagingRestricted ? (
		<p className="type-body-sm flex items-start gap-2 py-3 text-ink-2">
			<Ban className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
			{t('restrictedNote')}
		</p>
	) : null
	if (rows.length === 0) {
		return (
			<>
				{restricted}
				<div className="space-y-1 py-4">
					<p className="type-body text-ink-2">
						{box === 'REQUESTS' ? t('requestsEmpty') : t('empty')}
					</p>
					<p className="type-body-sm text-ink-3">
						{box === 'REQUESTS' ? t('requestsEmptyHint') : t('emptyHint')}
					</p>
				</div>
			</>
		)
	}

	return (
		<>
			{restricted}
			<ul>
				{rows.map(conversation => {
					const name = memberName(conversation.counterpart, tCommon)
					return (
						<li key={conversation.id} className="rule-row">
							<Link
								href={`/messages/${encodeURIComponent(conversation.id)}`}
								aria-label={
									conversation.unread
										? t('openWithNew', { name })
										: t('openWith', { name })
								}
								className="group flex min-w-0 items-center gap-3 rounded-sm py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
							>
								<MemberAvatar member={conversation.counterpart} />
								<span className="min-w-0 flex-1">
									<span className="flex items-baseline justify-between gap-3">
										<span className="type-panel truncate text-foreground underline-offset-4 group-hover:underline">
											{name}
										</span>
										{conversation.lastMessageAt ? (
											<span className="type-body-sm shrink-0 text-ink-3">
												{/* MSG-03: unread is a word, never colour alone (§4.3). */}
												{conversation.unread ? (
													<span className="type-label mr-2 text-foreground">
														{t('new')}
													</span>
												) : null}
												{formatTimeAgo(conversation.lastMessageAt, locale)}
											</span>
										) : null}
									</span>
									<span className="type-body-sm block truncate text-ink-3">
										{conversationPreview(conversation, tCommon, name =>
											exerciseLabel(name, tEx),
										)}
									</span>
								</span>
							</Link>
						</li>
					)
				})}
			</ul>
			{conversations.hasNextPage ? (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="mt-2"
					disabled={conversations.isFetchingNextPage}
					onClick={() => void conversations.fetchNextPage()}
				>
					{conversations.isFetchingNextPage ? (
						<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
					) : null}
					{conversations.isFetchingNextPage ? t('loadingOlder') : t('older')}
				</Button>
			) : null}
		</>
	)
}
