'use client'

import type {
	ConversationMessage,
	ConversationSummary,
} from '@sunsteel/contracts'
import {
	ArrowLeft,
	Ban,
	EyeOff,
	Flag,
	Loader2,
	MoreHorizontal,
	Trash2,
	User,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { ReportDialog } from '@/features/profile/report-dialog'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import {
	useConversationThread,
	useDeleteConversation,
	useDeleteMessage,
	useSendMessage,
} from '@/lib/api/hooks/useConversations'
import { memberName, startsGroup } from '@/lib/utils/messages'

import { MemberAvatar } from './member-avatar'
import { MessageComposer } from './message-composer'

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
	dateStyle: 'medium',
	timeStyle: 'short',
}

function isNotFound(error: unknown): boolean {
	return (error as { status?: number } | null)?.status === 404
}

/**
 * MSG-01: one conversation, read oldest first with the newest beside the
 * composer, as a §11.5 ruled list: a new author line starts when the author
 * changes or after a pause (`startsGroup`), never a bubble. The note that
 * messages are not end-to-end encrypted opens the history, where a first
 * conversation begins (decision 13). A conversation the server no longer
 * opens -- deleted, or a block or a hide between the two -- reads as
 * unavailable, without saying which.
 *
 * MSG-09: each of the other member's messages can be reported from its row,
 * which hands a moderator that message and the five before it. A message
 * moderation hid reads "Removed by moderation" for the other member and stays
 * readable to its author, who is told; a member whose messaging is restricted
 * sees why in place of the composer.
 */
export function ConversationThread({
	conversationId,
}: {
	conversationId: string
}) {
	const t = useTranslations('messaging.thread')
	const tCommon = useTranslations('messaging.common')
	const tComposer = useTranslations('messaging.composer')
	const locale = useLocale() as Locale
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const router = useRouter()
	const thread = useConversationThread(conversationId)
	const send = useSendMessage(conversationId)
	const removeConversation = useDeleteConversation()
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const end = useRef<HTMLDivElement>(null)
	const newestId = thread.data?.messages.at(-1)?.id

	// Bring the newest message into view on arrival, not when older pages load.
	useEffect(() => {
		if (newestId) end.current?.scrollIntoView({ block: 'end' })
	}, [newestId])

	if (thread.isPending) {
		return (
			<div
				aria-busy="true"
				aria-label={t('loading')}
				className="space-y-4 py-4"
			>
				<Skeleton className="h-10 w-56" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-3/4" />
			</div>
		)
	}

	if (thread.isError) {
		return (
			<div className="space-y-3 py-4">
				<BackLink label={t('back')} />
				<div role="alert" className="space-y-2">
					<h1 className="type-section text-foreground">
						{isNotFound(thread.error) ? t('notFound') : t('loadError')}
					</h1>
					<p className="type-body-sm text-ink-3">
						{isNotFound(thread.error)
							? t('notFoundHint')
							: errorText(thread.error)}
					</p>
					{isNotFound(thread.error) ? null : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => void thread.refetch()}
						>
							{tCommon('tryAgain')}
						</Button>
					)}
				</div>
			</div>
		)
	}

	const conversation = thread.data.conversation as ConversationSummary
	const messages = thread.data.messages
	const name = memberName(conversation.counterpart, tCommon)
	const counterpart = conversation.counterpart

	const onSend = (body: string) =>
		send.mutateAsync(body).catch(error => {
			push({
				title: tComposer('sendFailed'),
				description: errorText(error),
				variant: 'destructive',
			})
			throw error
		})

	return (
		<div className="flex flex-col gap-4">
			<BackLink label={t('back')} />

			<header className="rule-heading flex items-center gap-3 pb-3">
				<MemberAvatar member={counterpart} />
				<div className="min-w-0 flex-1">
					<h1 className="type-section truncate text-foreground">{name}</h1>
					{counterpart ? (
						<p className="type-body-sm truncate text-ink-3">
							@{counterpart.username}
						</p>
					) : null}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" aria-label={t('options')}>
							<MoreHorizontal className="h-4 w-4" aria-hidden />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{counterpart ? (
							<DropdownMenuItem asChild>
								<Link
									href={`/profile/${encodeURIComponent(counterpart.username)}`}
								>
									<User className="mr-2 h-4 w-4" aria-hidden />
									{t('viewProfile')}
								</Link>
							</DropdownMenuItem>
						) : null}
						<DropdownMenuItem onSelect={() => setConfirmingDelete(true)}>
							<Trash2 className="mr-2 h-4 w-4" aria-hidden />
							{t('deleteConversation')}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</header>

			<section aria-label={name} className="flex flex-col">
				{thread.hasNextPage ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="self-start"
						disabled={thread.isFetchingNextPage}
						onClick={() => void thread.fetchNextPage()}
					>
						{thread.isFetchingNextPage ? (
							<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
						) : null}
						{thread.isFetchingNextPage ? t('loadingEarlier') : t('earlier')}
					</Button>
				) : (
					<p className="type-body-sm pb-3 text-ink-3">
						{tCommon('encryption')}
					</p>
				)}

				{messages.length === 0 ? (
					<p className="type-body-sm rule-row py-3 text-ink-3">{t('empty')}</p>
				) : (
					<ol aria-live="polite" aria-relevant="additions">
						{messages.map((message, index) => (
							<MessageRow
								key={message.id}
								conversationId={conversationId}
								message={message}
								startsGroup={startsGroup(message, messages[index - 1])}
								author={message.sentByMe ? tCommon('you') : name}
								otherName={name}
								time={dateFormatter(locale, TIME_OPTIONS).format(
									new Date(message.createdAt),
								)}
							/>
						))}
					</ol>
				)}
				<div ref={end} />
			</section>

			{conversation.messagingRestricted ? (
				<p className="type-body-sm flex items-start gap-2 border-t border-rule-faint pt-4 text-ink-2">
					<Ban className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
					{t('restrictedNote')}
				</p>
			) : conversation.canSend ? (
				<div className="border-t border-rule-faint pt-4">
					<MessageComposer
						onSend={onSend}
						isSending={send.isPending}
						autoFocus
					/>
				</div>
			) : (
				<p className="type-body-sm border-t border-rule-faint pt-4 text-ink-3">
					{counterpart ? t('unavailableNote') : t('deletedMemberNote')}
				</p>
			)}
			{counterpart ? (
				<p className="type-body-sm text-ink-3">{t('blockHint')}</p>
			) : null}

			<AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('deleteConversationTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{counterpart
								? t('deleteConversationBody', { name })
								: t('deleteConversationBodyDeleted')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								removeConversation.mutate(conversationId, {
									onSuccess: () => router.push('/messages'),
									onError: error =>
										push({
											title: t('deleteConversationFailed'),
											description: errorText(error),
											variant: 'destructive',
										}),
								})
							}
						>
							{t('delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

function BackLink({ label }: { label: string }) {
	return (
		<Link
			href="/messages"
			className="type-body-sm inline-flex items-center gap-1 self-start text-ink-2 underline-offset-4 hover:text-foreground hover:underline"
		>
			<ArrowLeft className="size-4" aria-hidden />
			{label}
		</Link>
	)
}

function MessageRow({
	conversationId,
	message,
	startsGroup: first,
	author,
	otherName,
	time,
}: {
	conversationId: string
	message: ConversationMessage
	startsGroup: boolean
	author: string
	/** The other participant, whom a hidden message of mine is hidden from. */
	otherName: string
	time: string
}) {
	const t = useTranslations('messaging.thread')
	const tCommon = useTranslations('messaging.common')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const remove = useDeleteMessage(conversationId)
	const [confirming, setConfirming] = useState(false)
	const [reporting, setReporting] = useState(false)
	const removedForMe = message.hiddenByModeration && !message.sentByMe
	const canReport = !message.sentByMe && !message.deleted && !removedForMe

	return (
		<li className={first ? 'rule-row pt-3' : 'pt-1'}>
			{first ? (
				<p className="flex flex-wrap items-baseline gap-x-2">
					<span className="type-panel text-foreground">{author}</span>
					<time
						dateTime={message.createdAt}
						className="type-body-sm text-ink-3"
					>
						{time}
					</time>
				</p>
			) : (
				<span className="sr-only">
					{author}, {time}
				</span>
			)}
			<div className="flex items-start justify-between gap-2 pb-1">
				{message.deleted ? (
					<p className="type-body-sm text-ink-3">{tCommon('messageDeleted')}</p>
				) : removedForMe ? (
					<p className="type-body-sm text-ink-3">
						{tCommon('removedByModeration')}
					</p>
				) : (
					<div className="min-w-0">
						<p className="type-body whitespace-pre-wrap break-words text-foreground">
							{message.body}
						</p>
						{message.hiddenByModeration ? (
							<p className="type-body-sm mt-1 flex items-start gap-1.5 text-ink-3">
								<EyeOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
								{t('hiddenFromOther', { name: otherName })}
							</p>
						) : null}
					</div>
				)}
				{canReport ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="shrink-0"
						aria-label={t('reportMessageLabel', { name: author, time })}
						title={t('reportMessage')}
						onClick={() => setReporting(true)}
					>
						<Flag className="size-3.5" aria-hidden />
					</Button>
				) : null}
				{message.sentByMe && !message.deleted ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="shrink-0"
						aria-label={t('deleteMessageLabel', { time })}
						disabled={remove.isPending}
						onClick={() => setConfirming(true)}
					>
						<Trash2 className="size-3.5" aria-hidden />
					</Button>
				) : null}
			</div>
			{canReport ? (
				<ReportDialog
					open={reporting}
					onOpenChange={setReporting}
					subjectKind="MESSAGE"
					subjectId={message.id}
				/>
			) : null}
			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('deleteMessageTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteMessageBody')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								remove.mutate(message.id, {
									onError: error =>
										push({
											title: t('deleteMessageFailed'),
											description: errorText(error),
											variant: 'destructive',
										}),
								})
							}
						>
							{t('delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</li>
	)
}
