'use client'

import type {
	ConversationMessage,
	ConversationSummary,
	SendMessageRequest,
} from '@sunsteel/contracts'
import {
	ArrowLeft,
	Ban,
	ClipboardList,
	Dumbbell,
	EyeOff,
	Flag,
	Loader2,
	MoreHorizontal,
	Trash2,
	Trophy,
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
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import {
	useConversationThread,
	useDeleteConversation,
	useDeleteMessage,
	useMarkConversationRead,
	useSendMessage,
} from '@/lib/api/hooks/useConversations'
import {
	firstNewIndex,
	memberName,
	messageRoutineHref,
	messageWorkoutHref,
	readThrough,
	startsGroup,
	workoutName,
} from '@/lib/utils/messages'
import {
	getRecordTimelineExplanation,
	getRecordTimelinePerformanceLabel,
} from '@/lib/utils/progress-timeline'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

import { MemberAvatar } from './member-avatar'
import { type AttachedObject, MessageComposer } from './message-composer'
import { RequestPanel } from './request-panel'

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
 *
 * MSG-03: seeing the conversation reads it. Opening it, or a message arriving
 * while it is open in a visible tab, marks it read through the newest message
 * on screen; one that arrives while the tab is hidden waits for the reader to
 * come back. "New since you last looked" stays where the visit began.
 *
 * MSG-07: a message can carry one of its sender's routines, shown as a card
 * with the routine as it is now, which opens it to read and copy. A routine
 * handed in from "Send in a message" opens attached to the composer.
 */
export function ConversationThread({
	conversationId,
	initialAttachment = null,
}: {
	conversationId: string
	initialAttachment?: AttachedObject | null
}) {
	const t = useTranslations('messaging.thread')
	const tCommon = useTranslations('messaging.common')
	const tComposer = useTranslations('messaging.composer')
	const locale = useLocale() as Locale
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const router = useRouter()
	// MSG-02: blocking from a request stops this thread reading first, so the
	// conversation the block hides is not re-read into a 404 on the way out.
	const [leaving, setLeaving] = useState(false)
	const thread = useConversationThread(conversationId, !leaving)
	const send = useSendMessage(conversationId)
	const removeConversation = useDeleteConversation()
	const markRead = useMarkConversationRead(conversationId)
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const end = useRef<HTMLDivElement>(null)
	const newestId = thread.data?.messages.at(-1)?.id
	// The read position this visit began with: marking read moves the server's
	// but must not move the line the reader is looking at.
	const [since, setSince] = useState<{ id: string; at: string | null }>()
	const marked = useRef<string | null>(null)
	const [visible, setVisible] = useState(
		() => typeof document === 'undefined' || !document.hidden,
	)
	const loaded = thread.data?.conversation ?? null
	if (loaded && since?.id !== conversationId) {
		setSince({ id: conversationId, at: loaded.lastReadAt })
	}

	useEffect(() => {
		const onChange = () => setVisible(!document.hidden)
		document.addEventListener('visibilitychange', onChange)
		return () => document.removeEventListener('visibilitychange', onChange)
	}, [])

	useEffect(() => {
		if (!thread.data?.conversation) return
		const through = readThrough(
			thread.data.conversation,
			thread.data.messages,
			visible,
			marked.current,
		)
		if (!through) return
		marked.current = through
		markRead.mutate(through)
		// eslint-disable-next-line react-hooks/exhaustive-deps -- one mark per newest message
	}, [thread.data, visible])

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
	const newFrom = firstNewIndex(messages, since?.at ?? null)
	const name = memberName(conversation.counterpart, tCommon)
	const counterpart = conversation.counterpart

	const onSend = (content: SendMessageRequest) =>
		send
			.mutateAsync(content)
			.then(() => {
				// The routine went; a reload must not attach it again.
				if (initialAttachment) {
					router.replace(`/messages/${encodeURIComponent(conversationId)}`)
				}
			})
			.catch(error => {
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
							<NewSinceAware
								key={message.id}
								showLine={index === newFrom}
								label={t('newSince')}
							>
								<MessageRow
									conversationId={conversationId}
									message={message}
									startsGroup={startsGroup(message, messages[index - 1])}
									author={message.sentByMe ? tCommon('you') : name}
									otherName={name}
									time={dateFormatter(locale, TIME_OPTIONS).format(
										new Date(message.createdAt),
									)}
								/>
							</NewSinceAware>
						))}
					</ol>
				)}
				<div ref={end} />
			</section>

			{conversation.request?.direction === 'INCOMING' ? (
				<RequestPanel
					onLeave={() => setLeaving(true)}
					conversationId={conversationId}
					name={name}
					username={counterpart?.username ?? null}
				/>
			) : conversation.request?.direction === 'OUTGOING' &&
			  !conversation.canSend ? (
				// MSG-02: a sender waits after the first message, told neither
				// whether it was seen nor whether it was declined.
				<p className="type-body-sm border-t border-rule-faint pt-4 text-ink-2">
					{t('requestOutgoing', { name })}
				</p>
			) : conversation.messagingRestricted ? (
				<p className="type-body-sm flex items-start gap-2 border-t border-rule-faint pt-4 text-ink-2">
					<Ban className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
					{t('restrictedNote')}
				</p>
			) : conversation.canSend ? (
				<div className="border-t border-rule-faint pt-4">
					<MessageComposer
						onSend={onSend}
						isSending={send.isPending}
						initialAttachment={initialAttachment}
						autoFocus
					/>
				</div>
			) : (
				<p className="type-body-sm border-t border-rule-faint pt-4 text-ink-3">
					{counterpart ? t('unavailableNote') : t('deletedMemberNote')}
				</p>
			)}
			{counterpart && conversation.request?.direction !== 'INCOMING' ? (
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

/**
 * MSG-03: the line above the first message that arrived since the reader last
 * looked -- a ruled row with its words, never colour alone.
 */
function NewSinceAware({
	showLine,
	label,
	children,
}: {
	showLine: boolean
	label: string
	children: React.ReactNode
}) {
	if (!showLine) return <>{children}</>
	return (
		<>
			<li
				role="separator"
				aria-label={label}
				className="type-label flex items-center gap-3 pt-3 text-foreground"
			>
				<span className="h-px flex-1 bg-rule" aria-hidden />
				{label}
				<span className="h-px flex-1 bg-rule" aria-hidden />
			</li>
			{children}
		</>
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
					<div className="min-w-0 flex-1">
						{message.body ? (
							<p className="type-body whitespace-pre-wrap break-words text-foreground">
								{message.body}
							</p>
						) : null}
						{message.attachment ? (
							<AttachmentCard
								conversationId={conversationId}
								message={message}
							/>
						) : null}
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

/**
 * MSG-07/MSG-10: what a message carries, as it is now -- a routine or a
 * finished workout -- named, summed up and opened from its own page. One
 * deleted or hidden since says it is no longer available rather than what it
 * was.
 */
function AttachmentCard({
	conversationId,
	message,
}: {
	conversationId: string
	message: ConversationMessage
}) {
	const t = useTranslations('messaging.thread')
	const locale = useLocale() as Locale
	const unit = useWeightUnit()
	const attachment = message.attachment
	if (!attachment) return null
	const box = message.body
		? 'mt-2 max-w-md border border-rule p-3'
		: 'max-w-md border border-rule p-3'

	if (attachment.kind === 'WORKOUT') {
		const workout = attachment.workout
		const name = workout ? workoutName(workout) : ''
		return (
			<div className={box}>
				<p className="type-label flex items-center gap-1.5 text-ink-3">
					<Dumbbell className="size-3.5" aria-hidden />
					{t('workoutCardLabel')}
				</p>
				{workout ? (
					<div className="mt-1 space-y-2">
						<div className="min-w-0">
							<p className="type-panel truncate text-foreground">{name}</p>
							<p className="type-body-sm text-ink-3">
								{t('workoutMeta', {
									date: dateFormatter(locale, { dateStyle: 'medium' }).format(
										new Date(workout.endedAt),
									),
									duration: formatDuration(workout.durationSec),
									sets: workout.completedSets,
									volume: `${formatWeightAmount(workout.totalVolumeKg, unit, locale, 0)} ${getWeightUnitLabel(unit)}`,
								})}
							</p>
						</div>
						<Button asChild variant="outline" size="sm">
							<Link
								href={messageWorkoutHref(conversationId, message.id)}
								aria-label={t('openWorkoutLabel', { name })}
							>
								{t('openWorkout')}
							</Link>
						</Button>
					</div>
				) : (
					<p className="type-body-sm mt-1 text-ink-3">{t('workoutGone')}</p>
				)}
			</div>
		)
	}

	if (attachment.kind === 'RECORD') {
		return <RecordCard message={message} box={box} />
	}

	const routine = attachment.routine
	return (
		<div className={box}>
			<p className="type-label flex items-center gap-1.5 text-ink-3">
				<ClipboardList className="size-3.5" aria-hidden />
				{t('routineCardLabel')}
			</p>
			{routine ? (
				<div className="mt-1 space-y-2">
					<div className="min-w-0">
						<p className="type-panel truncate text-foreground">
							{routine.name}
						</p>
						<p className="type-body-sm text-ink-3">
							{t('routineMeta', {
								days: routine.dayCount,
								exercises: routine.exerciseCount,
							})}
						</p>
					</div>
					<Button asChild variant="outline" size="sm">
						<Link
							href={messageRoutineHref(conversationId, message.id)}
							aria-label={t('openRoutineLabel', { name: routine.name })}
						>
							{t('openRoutine')}
						</Link>
					</Button>
				</div>
			) : (
				<p className="type-body-sm mt-1 text-ink-3">{t('routineGone')}</p>
			)}
		</div>
	)
}

/**
 * MSG-11: a personal record, as it was set -- its lift, the performance, the
 * best it beat in the progress timeline's words, and when. Everything it says
 * is on the card; a record a correction removed says it is no longer
 * available.
 */
function RecordCard({
	message,
	box,
}: {
	message: ConversationMessage
	box: string
}) {
	const t = useTranslations('messaging.thread')
	const tTimeline = useTranslations('progress.timeline')
	const tEx = useTranslations('catalog.exercises')
	const locale = useLocale() as Locale
	const unit = useWeightUnit()
	const record =
		message.attachment?.kind === 'RECORD' ? message.attachment.record : null
	return (
		<div className={box}>
			<p className="type-label flex items-center gap-1.5 text-ink-3">
				<Trophy className="size-3.5" aria-hidden />
				{t('recordCardLabel')}
			</p>
			{record ? (
				<div className="mt-1 min-w-0 space-y-1">
					<p className="type-panel truncate text-foreground">
						{exerciseLabel(record.exerciseName, tEx)}
					</p>
					<p className="type-data type-data-strong text-foreground">
						{getRecordTimelinePerformanceLabel(record, unit, locale)}
					</p>
					<p className="type-body-sm text-ink-2">
						{getRecordTimelineExplanation(record, unit, tTimeline, locale)}
					</p>
					<p className="type-body-sm text-ink-3">
						<time dateTime={record.occurredAt}>
							{dateFormatter(locale, { dateStyle: 'medium' }).format(
								new Date(record.occurredAt),
							)}
						</time>
					</p>
				</div>
			) : (
				<p className="type-body-sm mt-1 text-ink-3">{t('recordGone')}</p>
			)}
		</div>
	)
}
