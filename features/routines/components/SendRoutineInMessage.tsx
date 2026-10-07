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
import { memberName, messageHref } from '@/lib/utils/messages'

/** How many recent conversations the dialog offers before searching. */
const RECENT_CONVERSATIONS = 5

/**
 * MSG-07: send this routine to a member. Choosing a conversation or a member
 * opens the composer with the routine attached, where a note can be added and
 * nothing goes until Send; the server decides there whether the member may be
 * written to. It says first what sending does: the other member may open and
 * copy the routine, whatever its visibility, until the message is deleted.
 */
export function SendRoutineInMessage({
	routineId,
	routineName,
}: {
	routineId: string
	routineName: string
}) {
	const t = useTranslations('routines.sharing')
	const tCommon = useTranslations('messaging.common')
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const searchId = useId()
	const conversations = useConversations()
	const search = useUserSearch(query, 5)
	const recent = (conversations.data?.conversations ?? [])
		.filter(conversation => conversation.canSend && conversation.counterpart)
		.slice(0, RECENT_CONVERSATIONS)

	const go = (href: string) => {
		setOpen(false)
		router.push(href)
	}

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

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t('sendDialogTitle', { name: routineName })}
						</DialogTitle>
						<DialogDescription>{t('sendDialogDescription')}</DialogDescription>
					</DialogHeader>

					<section className="space-y-2">
						<h3 className="type-label text-ink-3">{t('sendRecent')}</h3>
						{conversations.isPending ? (
							<Skeleton className="h-11" />
						) : recent.length === 0 ? (
							<p className="type-body-sm text-ink-3">
								{t('sendNoConversations')}
							</p>
						) : (
							<ul className="border-t border-rule-faint">
								{recent.map(conversation => {
									const member = conversation.counterpart!
									const name = memberName(member, tCommon)
									return (
										<li key={conversation.id} className="rule-row">
											<ChoiceRow
												label={t('sendTo', { name })}
												name={name}
												username={member.username}
												avatar={member}
												onChoose={() =>
													go(
														messageHref(
															member.username,
															conversation.id,
															routineId,
														),
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
						<Label htmlFor={searchId}>{t('sendSearchLabel')}</Label>
						<Input
							id={searchId}
							value={query}
							placeholder={t('sendSearchPlaceholder')}
							autoComplete="off"
							onChange={event => setQuery(event.target.value)}
						/>
						{query.trim().length >= 2 && search.data ? (
							search.data.length === 0 ? (
								<p className="type-body-sm text-ink-3">
									{t('sendSearchEmpty')}
								</p>
							) : (
								<ul className="border-t border-rule-faint">
									{search.data.map(member => {
										const name = member.name.trim() || `@${member.username}`
										return (
											<li key={member.id} className="rule-row">
												<ChoiceRow
													label={t('sendTo', { name })}
													name={name}
													username={member.username}
													avatar={{
														id: member.id,
														username: member.username,
														name: member.name,
														avatarUrl: member.avatarUrl ?? null,
													}}
													onChoose={() =>
														go(messageHref(member.username, null, routineId))
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
		</div>
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
