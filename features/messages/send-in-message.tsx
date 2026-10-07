'use client'

import type { ConversationMember } from '@sunsteel/contracts'
import { ChevronRight, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberAvatar } from '@/features/messages/member-avatar'
import { useConversations } from '@/lib/api/hooks/useConversations'
import { useUserSearch } from '@/lib/api/hooks/useUserSearch'
import { type AttachRef, memberName, messageHref } from '@/lib/utils/messages'

/** How many recent conversations the dialog offers before searching. */
const RECENT_CONVERSATIONS = 5

/**
 * MSG-07/MSG-10: send one of the member's own routines or workouts to a
 * member. Choosing a conversation or a member opens the composer with it
 * attached, where a note can be added and nothing goes until Send; the
 * server decides there whether the member may be written to.
 */
export function SendInMessageDialog({
	open,
	onOpenChange,
	attach,
	name,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	attach: AttachRef
	name: string
}) {
	const t = useTranslations('messaging.send')
	const tCommon = useTranslations('messaging.common')
	const router = useRouter()
	const [query, setQuery] = useState('')
	const searchId = useId()
	const conversations = useConversations()
	const search = useUserSearch(query, 5)
	const recent = (conversations.data?.conversations ?? [])
		.filter(conversation => conversation.canSend && conversation.counterpart)
		.slice(0, RECENT_CONVERSATIONS)

	const go = (href: string) => {
		onOpenChange(false)
		router.push(href)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('title', { name })}</DialogTitle>
					<DialogDescription>{t('description')}</DialogDescription>
				</DialogHeader>

				<section className="space-y-2">
					<h3 className="type-label text-ink-3">{t('recent')}</h3>
					{conversations.isPending ? (
						<Skeleton className="h-11" />
					) : recent.length === 0 ? (
						<p className="type-body-sm text-ink-3">{t('noConversations')}</p>
					) : (
						<ul className="border-t border-rule-faint">
							{recent.map(conversation => {
								const member = conversation.counterpart!
								const memberLabel = memberName(member, tCommon)
								return (
									<li key={conversation.id} className="rule-row">
										<ChoiceRow
											label={t('sendTo', { name: memberLabel })}
											name={memberLabel}
											username={member.username}
											avatar={member}
											onChoose={() =>
												go(
													messageHref(member.username, conversation.id, attach),
												)
											}
										/>
									</li>
								)
							})}
						</ul>
					)}
				</section>

				<section className="space-y-2">
					<Label htmlFor={searchId}>{t('searchLabel')}</Label>
					<Input
						id={searchId}
						value={query}
						placeholder={t('searchPlaceholder')}
						autoComplete="off"
						onChange={event => setQuery(event.target.value)}
					/>
					{query.trim().length >= 2 && search.data ? (
						search.data.length === 0 ? (
							<p className="type-body-sm text-ink-3">{t('searchEmpty')}</p>
						) : (
							<ul className="border-t border-rule-faint">
								{search.data.map(member => {
									const memberLabel =
										member.name.trim() || `@${member.username}`
									return (
										<li key={member.id} className="rule-row">
											<ChoiceRow
												label={t('sendTo', { name: memberLabel })}
												name={memberLabel}
												username={member.username}
												avatar={{
													id: member.id,
													username: member.username,
													name: member.name,
													avatarUrl: member.avatarUrl ?? null,
												}}
												onChoose={() =>
													go(messageHref(member.username, null, attach))
												}
											/>
										</li>
									)
								})}
							</ul>
						)
					) : null}
				</section>
			</DialogContent>
		</Dialog>
	)
}

/**
 * MSG-07: the routine page's "Send in a message", saying first what sending
 * does: the other member may open and copy the routine, whatever its
 * visibility, until the message is deleted.
 */
export function SendRoutineInMessage({
	routineId,
	routineName,
}: {
	routineId: string
	routineName: string
}) {
	const t = useTranslations('routines.sharing')
	const [open, setOpen] = useState(false)
	return (
		<div className="space-y-3 border-t border-rule pt-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="type-panel text-foreground">{t('sendInMessage')}</p>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => setOpen(true)}
				>
					<MessageSquare className="size-4" aria-hidden />
					{t('sendInMessage')}
				</Button>
			</div>
			<p className="type-body-sm max-w-[68ch] text-ink-3">
				{t('sendInMessageNote')}
			</p>
			<SendInMessageDialog
				open={open}
				onOpenChange={setOpen}
				attach={{ kind: 'ROUTINE', id: routineId }}
				name={routineName}
			/>
		</div>
	)
}

/** MSG-10: a finished workout's "Send in a message", beside its share link. */
export function SendWorkoutInMessage({
	sessionId,
	name,
}: {
	sessionId: string
	name: string
}) {
	const t = useTranslations('workout.history')
	const [open, setOpen] = useState(false)
	return (
		<>
			<Button
				type="button"
				size="sm"
				variant="outline"
				onClick={() => setOpen(true)}
			>
				<MessageSquare className="size-4" aria-hidden />
				{t('sendInMessage')}
			</Button>
			<SendInMessageDialog
				open={open}
				onOpenChange={setOpen}
				attach={{ kind: 'WORKOUT', id: sessionId }}
				name={name}
			/>
		</>
	)
}

function ChoiceRow({
	label,
	name,
	username,
	avatar,
	onChoose,
}: {
	label: string
	name: string
	username: string
	avatar: ConversationMember
	onChoose: () => void
}) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onChoose}
			className="group flex min-h-11 w-full items-center gap-3 rounded-sm py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<MemberAvatar member={avatar} size="sm" />
			<span className="min-w-0 flex-1">
				<span className="type-body block truncate text-foreground underline-offset-4 group-hover:underline">
					{name}
				</span>
				<span className="type-body-sm block truncate text-ink-3">
					@{username}
				</span>
			</span>
			<ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
		</button>
	)
}
