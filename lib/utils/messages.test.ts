import type {
	ConversationMessage,
	ConversationMessagesResponse,
	ConversationsResponse,
	ConversationSummary,
} from '@sunsteel/contracts'
import { MESSAGE_BODY_MAX } from '@sunsteel/contracts'
import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	composerState,
	conversationListFromPages,
	conversationPreview,
	enterSends,
	firstNewIndex,
	flattenConversationPages,
	memberName,
	messageHref,
	readThrough,
	startsGroup,
	threadFromPages,
} from './messages'

const en = translatorFor('en', 'messaging.common')
const es = translatorFor('es', 'messaging.common')

const member = {
	id: 'm1',
	username: 'ana',
	name: 'Ana Ruiz',
	avatarUrl: null,
}

const message = (
	id: string,
	at: string,
	overrides: Partial<ConversationMessage> = {},
): ConversationMessage => ({
	id,
	sentByMe: false,
	body: `text ${id}`,
	deleted: false,
	hiddenByModeration: false,
	createdAt: `2026-10-05T${at}:00.000Z`,
	...overrides,
})

const summary = (
	id: string,
	overrides: Partial<ConversationSummary> = {},
): ConversationSummary => ({
	id,
	counterpart: member,
	lastMessage: message('x', '10:00'),
	lastMessageAt: '2026-10-05T10:00:00.000Z',
	canSend: true,
	messagingRestricted: false,
	unread: false,
	lastReadAt: null,
	request: null,
	...overrides,
})

function pages<T>(...items: T[]): InfiniteData<T, string | null> {
	return { pages: items, pageParams: items.map(() => null) }
}

describe('MSG-01 the conversation list', () => {
	it('reads the loaded pages as one list, a conversation that moved up shown once', () => {
		const data = pages<ConversationsResponse>(
			{
				conversations: [summary('a'), summary('b')],
				nextCursor: 'c',
				messagingRestricted: false,
			},
			{
				conversations: [summary('b'), summary('c')],
				nextCursor: null,
				messagingRestricted: false,
			},
		)
		expect(flattenConversationPages(data).map(row => row.id)).toEqual([
			'a',
			'b',
			'c',
		])
	})

	it('previews the newest message, says who wrote it and says when it was deleted', () => {
		expect(conversationPreview(summary('a'), en)).toBe('text x')
		expect(
			conversationPreview(
				summary('a', {
					lastMessage: message('y', '10:00', {
						sentByMe: true,
						body: 'see\n you',
					}),
				}),
				en,
			),
		).toBe('You: see you')
		expect(
			conversationPreview(
				summary('a', {
					lastMessage: message('y', '10:00', { deleted: true, body: null }),
				}),
				es,
			),
		).toBe('Mensaje eliminado')
		expect(conversationPreview(summary('a', { lastMessage: null }), en)).toBe(
			'No messages',
		)
	})

	it('MSG-09: a hidden message keeps no text in the other member preview, and keeps it in the author preview', () => {
		const hidden = { hiddenByModeration: true, body: null }
		expect(
			conversationPreview(
				summary('a', { lastMessage: message('y', '10:00', hidden) }),
				en,
			),
		).toBe('Removed by moderation')
		expect(
			conversationPreview(
				summary('a', { lastMessage: message('y', '10:00', hidden) }),
				es,
			),
		).toBe('Eliminado por moderación')
		expect(
			conversationPreview(
				summary('a', {
					lastMessage: message('y', '10:00', {
						hiddenByModeration: true,
						sentByMe: true,
						body: 'mine',
					}),
				}),
				en,
			),
		).toBe('You: mine')
	})

	it('MSG-09: says the viewer is restricted from the newest page', () => {
		const data = pages<ConversationsResponse>(
			{
				conversations: [summary('a')],
				nextCursor: 'c',
				messagingRestricted: true,
			},
			{
				conversations: [summary('b')],
				nextCursor: null,
				messagingRestricted: false,
			},
		)
		const view = conversationListFromPages(data)
		expect(view.messagingRestricted).toBe(true)
		expect(view.conversations.map(row => row.id)).toEqual(['a', 'b'])
	})

	it('names a member by name, else handle, and a deleted account as such', () => {
		expect(memberName(member, en)).toBe('Ana Ruiz')
		expect(memberName({ ...member, name: ' ' }, en)).toBe('@ana')
		expect(memberName(null, en)).toBe('Deleted member')
		expect(memberName(null, es)).toBe('Miembro eliminado')
	})
})

describe('MSG-01 a thread', () => {
	it('reads oldest first across pages that arrive newest first', () => {
		const data = pages<ConversationMessagesResponse>(
			{
				conversation: summary('a'),
				messages: [message('3', '10:03'), message('2', '10:02')],
				nextCursor: 'n',
			},
			{
				conversation: summary('a'),
				messages: [message('2', '10:02'), message('1', '10:01')],
				nextCursor: null,
			},
		)
		const thread = threadFromPages(data)
		expect(thread.messages.map(row => row.id)).toEqual(['1', '2', '3'])
		expect(thread.conversation?.id).toBe('a')
	})

	it('starts an author line on a change of author or after a pause', () => {
		const first = message('1', '10:00')
		expect(startsGroup(first, undefined)).toBe(true)
		expect(startsGroup(message('2', '10:04'), first)).toBe(false)
		expect(startsGroup(message('2', '10:06'), first)).toBe(true)
		expect(startsGroup(message('2', '10:01', { sentByMe: true }), first)).toBe(
			true,
		)
	})
})

describe('MSG-01 the composer', () => {
	it('counts as the server does and sends only what it would accept', () => {
		expect(composerState('  hi\r\nthere ')).toEqual({
			length: 8,
			sendable: 'hi\nthere',
			over: false,
		})
		expect(composerState('   ').sendable).toBeNull()
		expect(composerState('💪'.repeat(MESSAGE_BODY_MAX)).over).toBe(false)
		const long = composerState('a'.repeat(MESSAGE_BODY_MAX + 1))
		expect(long.over).toBe(true)
		expect(long.sendable).toBeNull()
	})

	it('sends on Enter with a keyboard, never on Shift+Enter, while composing or on a phone', () => {
		const enter = { key: 'Enter', shiftKey: false }
		expect(enterSends(enter, false)).toBe(true)
		expect(enterSends({ ...enter, shiftKey: true }, false)).toBe(false)
		expect(enterSends({ ...enter, isComposing: true }, false)).toBe(false)
		expect(enterSends(enter, true)).toBe(false)
		expect(enterSends({ key: 'a', shiftKey: false }, false)).toBe(false)
	})

	it('opens the conversation a pair has, or a new message to the member', () => {
		expect(messageHref('ana', 'c-1')).toBe('/messages/c-1')
		expect(messageHref('ana b', null)).toBe('/messages/new?to=ana%20b')
	})
})

describe('MSG-03 unread state', () => {
	const thread = [
		message('a', '10:00'),
		message('b', '10:01', { sentByMe: true }),
		message('c', '10:05'),
		message('d', '10:06'),
	]

	it('puts "new since you last looked" above the first message after it', () => {
		expect(firstNewIndex(thread, '2026-10-05T10:02:00.000Z')).toBe(2)
	})

	it('never on my own messages', () => {
		expect(
			firstNewIndex(
				[message('a', '10:00'), message('b', '10:03', { sentByMe: true })],
				'2026-10-05T10:01:00.000Z',
			),
		).toBe(-1)
	})

	it('not at all when nothing was ever read, nothing is new, or it would sit at the top', () => {
		expect(firstNewIndex(thread, null)).toBe(-1)
		expect(firstNewIndex(thread, '2026-10-05T10:07:00.000Z')).toBe(-1)
		expect(firstNewIndex(thread, '2026-10-05T09:00:00.000Z')).toBe(-1)
	})

	it('marks read through the newest message, once, only while visible and unread', () => {
		expect(readThrough({ unread: true }, thread, true, null)).toBe('d')
		expect(readThrough({ unread: true }, thread, true, 'd')).toBeNull()
		expect(readThrough({ unread: true }, thread, false, null)).toBeNull()
		expect(readThrough({ unread: false }, thread, true, null)).toBeNull()
		expect(readThrough({ unread: true }, [], true, null)).toBeNull()
	})
})
