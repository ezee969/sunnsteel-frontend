'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Suspense, useEffect } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { MemberAvatar } from '@/features/messages/member-avatar'
import { MessageComposer } from '@/features/messages/message-composer'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useStartConversation } from '@/lib/api/hooks/useConversations'
import { usePublicUser } from '@/lib/api/hooks/usePublicUser'
import { messageHref } from '@/lib/utils/messages'

/**
 * MSG-01: the first message to a member, which is what starts the
 * conversation, so an empty one never exists. The profile read says whether
 * this viewer may write; a pair that already has a conversation goes to it.
 */
function NewMessage() {
	const t = useTranslations('messaging.new')
	const tComposer = useTranslations('messaging.composer')
	const tCommon = useTranslations('messaging.common')
	const tThread = useTranslations('messaging.thread')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const router = useRouter()
	const to = useSearchParams().get('to')?.trim() ?? ''
	const member = usePublicUser(to)
	const start = useStartConversation()
	const existing = member.data?.messaging?.conversationId ?? null

	useEffect(() => {
		if (existing && member.data) {
			router.replace(messageHref(member.data.username, existing))
		}
	}, [existing, member.data, router])

	const back = (
		<Link
			href="/messages"
			className="type-body-sm inline-flex items-center gap-1 self-start text-ink-2 underline-offset-4 hover:text-foreground hover:underline"
		>
			<ArrowLeft className="size-4" aria-hidden />
			{tThread('back')}
		</Link>
	)

	if (!to) {
		return (
			<div className="flex flex-col gap-3">
				{back}
				<p className="type-body text-ink-2">{t('missing')}</p>
			</div>
		)
	}

	if (member.isPending || existing) {
		return (
			<div aria-busy="true" aria-label={t('loading')} className="space-y-3">
				<Skeleton className="h-10 w-56" />
				<Skeleton className="h-24 w-full" />
			</div>
		)
	}

	if (member.isError || !member.data.messaging?.canStart) {
		return (
			<div className="flex flex-col gap-3">
				{back}
				<div role="alert" className="space-y-1">
					<p className="type-body text-ink-2">{t('unavailable')}</p>
					<p className="type-body-sm text-ink-3">{t('unavailableHint')}</p>
				</div>
			</div>
		)
	}

	const profile = member.data
	const name = profile.name.trim() || `@${profile.username}`

	return (
		<div className="flex flex-col gap-4">
			{back}
			<div className="rule-heading flex items-center gap-3 pb-3">
				<MemberAvatar
					member={{
						id: profile.id,
						username: profile.username,
						name: profile.name,
						avatarUrl: profile.avatarUrl ?? null,
					}}
				/>
				<div className="min-w-0">
					<p className="type-panel truncate text-foreground">
						{t('to', { name })}
					</p>
					<p className="type-body-sm truncate text-ink-3">
						@{profile.username}
					</p>
				</div>
			</div>
			<p className="type-body-sm text-ink-3">{tCommon('encryption')}</p>
			<MessageComposer
				autoFocus
				isSending={start.isPending}
				onSend={body =>
					start
						.mutateAsync({ recipient: profile.id, body })
						.then(sent => {
							router.replace(
								messageHref(profile.username, sent.conversation.id),
							)
						})
						.catch(error => {
							push({
								title: tComposer('sendFailed'),
								description: errorText(error),
								variant: 'destructive',
							})
							throw error
						})
				}
			/>
		</div>
	)
}

export default function NewMessagePage() {
	const t = useTranslations('messaging.new')
	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6 sm:gap-8">
			<HeroSection title={<>{t('pageTitle')}</>} />
			<Suspense fallback={<Skeleton className="h-40" />}>
				<NewMessage />
			</Suspense>
		</div>
	)
}
