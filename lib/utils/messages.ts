import {
	type ConversationMember,
	type ConversationMessage,
	type ConversationMessagesResponse,
	type ConversationsResponse,
	type ConversationSummary,
	MESSAGE_BODY_MAX,
	messageBodyLength,
	normalizeMessageBody,
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
): string {
	const last = conversation.lastMessage
	if (!last) return t('noMessages')
	// MSG-09: a message moderation hid keeps no text for the other participant;
	// its author still reads it.
	const text = last.deleted
		? t('messageDeleted')
		: last.hiddenByModeration && !last.sentByMe
			? t('removedByModeration')
			: (last.body ?? '')
	const line = text.replace(/\s+/g, ' ').trim()
	return last.sentByMe ? t('youSaid', { text: line }) : line
}

export interface ComposerState {
	length: number
	/** The body as it would be sent, or null when it cannot be. */
	sendable: string | null
	over: boolean
}

/** What the composer can say about a draft, by the server's own rule. */
export function composerState(draft: string): ComposerState {
	const length = messageBodyLength(draft.replace(/\r\n?/g, '\n').trim())
	return {
		length,
		sendable: normalizeMessageBody(draft),
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

/** Where a profile's Message action opens. */
export function messageHref(
	username: string,
	conversationId: string | null,
): string {
	return conversationId
		? `/messages/${encodeURIComponent(conversationId)}`
		: `/messages/new?to=${encodeURIComponent(username)}`
}
