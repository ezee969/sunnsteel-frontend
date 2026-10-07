import {
	type ConversationMember,
	type ConversationMessage,
	type ConversationMessagesResponse,
	type ConversationsResponse,
	type ConversationSummary,
	MESSAGE_BODY_MAX,
	type MessageAttachment,
	messageBodyLength,
	messageNote,
	type MessageRecordSummary,
	type MessageWorkoutSummary,
	type SendMessageRequest,
} from '@sunsteel/contracts'
import type { InfiniteData } from '@tanstack/react-query'

import type { Translator } from '@/i18n/translator'

/**
 * MSG-01: the pure half of the messaging screens -- the loaded pages read as
 * one list, the order a thread is read in, where a new author line starts,
 * and the words for a preview, a member and the composer's count.
 */

export function flattenConversationPages(
	data: InfiniteData<ConversationsResponse, string | null>,
): ConversationSummary[] {
	const seen = new Set<string>()
	const out: ConversationSummary[] = []
	for (const page of data.pages) {
		for (const conversation of page.conversations) {
			// A conversation that moved up between pages is shown once, where the
			// first page put it.
			if (seen.has(conversation.id)) continue
			seen.add(conversation.id)
			out.push(conversation)
		}
	}
	return out
}

export interface ConversationListView {
	conversations: ConversationSummary[]
	/** MSG-09: the viewer's own messaging is restricted by moderation. */
	messagingRestricted: boolean
}

/** The list as the page reads it: the rows, and whether the viewer may write. */
export function conversationListFromPages(
	data: InfiniteData<ConversationsResponse, string | null>,
): ConversationListView {
	return {
		conversations: flattenConversationPages(data),
		// The newest page is the freshest answer about the viewer.
		messagingRestricted: data.pages[0]?.messagingRestricted ?? false,
	}
}

export interface ThreadView {
	conversation: ConversationSummary | null
	/** Oldest first, as a conversation is read. */
	messages: ConversationMessage[]
}

/** Pages arrive newest first; a thread reads oldest first, newest at the end. */
export function threadFromPages(
	data: InfiniteData<ConversationMessagesResponse, string | null>,
): ThreadView {
	const seen = new Set<string>()
	const newestFirst: ConversationMessage[] = []
	for (const page of data.pages) {
		for (const message of page.messages) {
			if (seen.has(message.id)) continue
			seen.add(message.id)
			newestFirst.push(message)
		}
	}
	return {
		conversation: data.pages[0]?.conversation ?? null,
		messages: newestFirst.reverse(),
	}
}

/**
 * MSG-03: where "new since you last looked" goes -- the first message from the
 * other member after the read position the reader opened the conversation
 * with -- or -1 when there is nothing new, nothing was ever read, or the new
 * part starts at the top, where a line would only repeat that it all is.
 */
export function firstNewIndex(
	messages: ConversationMessage[],
	lastReadAt: string | null,
): number {
	if (!lastReadAt) return -1
	const since = Date.parse(lastReadAt)
	const index = messages.findIndex(
		message => !message.sentByMe && Date.parse(message.createdAt) > since,
	)
	return index > 0 ? index : -1
}

/**
 * MSG-03: the message to mark read through -- the newest one on screen -- or
 * null when there is nothing to mark: the conversation has nothing new, the
 * tab is hidden (a message that arrives then stays unread), or it was marked
 * through that message already.
 */
export function readThrough(
	conversation: { unread: boolean },
	messages: ConversationMessage[],
	visible: boolean,
	alreadyMarked: string | null,
): string | null {
	const newest = messages.at(-1)
	if (!conversation.unread || !visible || !newest) return null
	return newest.id === alreadyMarked ? null : newest.id
}

/** Consecutive messages from one side within this long share an author line. */
export const MESSAGE_GROUP_GAP_MS = 5 * 60_000

/**
 * Whether a message starts a new author line: the first one, a change of
 * author, or a pause longer than `MESSAGE_GROUP_GAP_MS`.
 */
export function startsGroup(
	message: ConversationMessage,
	previous: ConversationMessage | undefined,
): boolean {
	if (!previous) return true
	if (previous.sentByMe !== message.sentByMe) return true
	return (
		Date.parse(message.createdAt) - Date.parse(previous.createdAt) >
		MESSAGE_GROUP_GAP_MS
	)
}

/** A member's name as a conversation shows it; a deleted account has none. */
export function memberName(
	member: ConversationMember | null,
	t: Translator<'messaging.common'>,
): string {
	if (!member) return t('deletedMember')
	return member.name.trim() || `@${member.username}`
}

/** One line for the conversation list. */
export function conversationPreview(
	conversation: ConversationSummary,
	t: Translator<'messaging.common'>,
	exerciseName: (name: string) => string = name => name,
): string {
	const last = conversation.lastMessage
	if (!last) return t('noMessages')
	// MSG-09: a message moderation hid keeps no text for the other participant;
	// its author still reads it.
	const text = last.deleted
		? t('messageDeleted')
		: last.hiddenByModeration && !last.sentByMe
			? t('removedByModeration')
			: last.body
				? last.body
				: // MSG-07/MSG-10: an object sent without a note is named by it.
					last.attachment
					? last.attachment.kind === 'RECORD'
						? recordLine(last.attachment.record, t, exerciseName)
						: attachmentLine(last.attachment, t)
					: ''
	const line = text.replace(/\s+/g, ' ').trim()
	return last.sentByMe ? t('youSaid', { text: line }) : line
}

/** MSG-07/MSG-10: what a message carries, in one line. */
export function attachmentLine(
	attachment: MessageAttachment,
	t: Translator<'messaging.common'>,
): string {
	switch (attachment.kind) {
		case 'ROUTINE':
			return routineLine(attachment.routine, t)
		case 'WORKOUT':
			return workoutLine(attachment.workout, t)
		case 'RECORD':
			return recordLine(attachment.record, t)
	}
}

/**
 * MSG-11: a record in one line, by its lift (as `exerciseName` names it, the
 * catalog's word in the reader's language), or that it is no longer
 * available.
 */
export function recordLine(
	record: MessageRecordSummary | null,
	t: Translator<'messaging.common'>,
	exerciseName: (name: string) => string = name => name,
): string {
	return record
		? t('sharedRecord', { name: exerciseName(record.exerciseName) })
		: t('recordUnavailable')
}

/** MSG-10: a workout's name -- its routine and day, as a recap names it. */
export function workoutName(workout: {
	routineName: string
	dayName?: string | null
}): string {
	return [workout.routineName, workout.dayName].filter(Boolean).join(' · ')
}

/** MSG-10: a workout in one line, or that it is no longer available. */
export function workoutLine(
	workout: MessageWorkoutSummary | null,
	t: Translator<'messaging.common'>,
): string {
	return workout
		? t('sharedWorkout', { name: workoutName(workout) })
		: t('workoutUnavailable')
}

/** MSG-07: a routine in one line, or that it is no longer available. */
export function routineLine(
	routine: { name: string } | null,
	t: Translator<'messaging.common'>,
): string {
	return routine
		? t('sharedRoutine', { name: routine.name })
		: t('routineUnavailable')
}

export interface ComposerState {
	length: number
	/**
	 * What would be sent, or null when nothing can be: the text, and the
	 * object it carries (MSG-07/MSG-10), beside which the text may be empty.
	 */
	sendable: SendMessageRequest | null
	over: boolean
}

/**
 * MSG-07/MSG-10/MSG-11: one object a message carries -- a routine, a workout
 * or a record. A record also names its lift, so the composer can find it.
 */
export interface AttachRef {
	kind: 'ROUTINE' | 'WORKOUT' | 'RECORD'
	id: string
	exerciseId?: string
}

/** What the composer can say about a draft, by the server's own rule. */
export function composerState(
	draft: string,
	attached: AttachRef | null = null,
): ComposerState {
	const length = messageBodyLength(draft.replace(/\r\n?/g, '\n').trim())
	const note = messageNote(draft, attached !== null)
	return {
		length,
		sendable:
			note === undefined
				? null
				: {
						...(note === null ? {} : { body: note }),
						...(attached?.kind === 'ROUTINE' ? { routineId: attached.id } : {}),
						...(attached?.kind === 'WORKOUT' ? { sessionId: attached.id } : {}),
						...(attached?.kind === 'RECORD'
							? { recordEventId: attached.id }
							: {}),
					},
		over: length > MESSAGE_BODY_MAX,
	}
}

/**
 * Enter sends on a device with a keyboard; Shift+Enter, and an IME still
 * composing, add a line instead. A phone's Return always adds a line, because
 * its keyboard has no Shift and the Send button is beside it.
 */
export function enterSends(
	event: { key: string; shiftKey: boolean; isComposing?: boolean },
	coarsePointer: boolean,
): boolean {
	return (
		event.key === 'Enter' &&
		!event.shiftKey &&
		!event.isComposing &&
		!coarsePointer
	)
}

/** MSG-07/MSG-10: the query that hands an object to the composer. */
export const ATTACH_PARAMS = {
	ROUTINE: 'routine',
	WORKOUT: 'workout',
	RECORD: 'record',
} as const

/** MSG-11: the lift a handed-in record belongs to. */
export const ATTACH_EXERCISE_PARAM = 'exercise'

/**
 * Where a profile's Message action opens. With an object (MSG-07/MSG-10),
 * the composer opens with it attached, ready for a note.
 */
export function messageHref(
	username: string,
	conversationId: string | null,
	attached: AttachRef | null = null,
): string {
	const query = attached
		? [
				`${ATTACH_PARAMS[attached.kind]}=${encodeURIComponent(attached.id)}`,
				...(attached.exerciseId
					? [
							`${ATTACH_EXERCISE_PARAM}=${encodeURIComponent(attached.exerciseId)}`,
						]
					: []),
			].join('&')
		: ''
	return conversationId
		? `/messages/${encodeURIComponent(conversationId)}${query ? `?${query}` : ''}`
		: `/messages/new?to=${encodeURIComponent(username)}${query ? `&${query}` : ''}`
}

/** MSG-10: the page that opens the workout a message shared. */
export function messageWorkoutHref(
	conversationId: string,
	messageId: string,
): string {
	return `/messages/${encodeURIComponent(conversationId)}/workouts/${encodeURIComponent(messageId)}`
}

/**
 * MSG-07: the routines a member may send -- their own, never one moderation
 * hid, which the server refuses -- with archived ones last.
 */
export function sendableRoutines<
	R extends { isCompleted: boolean; isHiddenByModeration?: boolean },
>(routines: R[]): R[] {
	const offered = routines.filter(routine => !routine.isHiddenByModeration)
	return [
		...offered.filter(routine => !routine.isCompleted),
		...offered.filter(routine => routine.isCompleted),
	]
}

/** MSG-07: the page that opens the routine a message shared. */
export function messageRoutineHref(
	conversationId: string,
	messageId: string,
): string {
	return `/messages/${encodeURIComponent(conversationId)}/routines/${encodeURIComponent(messageId)}`
}
