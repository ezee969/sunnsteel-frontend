import type {
	ConversationBox,
	ConversationMessage,
	ConversationMessagesResponse,
	ConversationsResponse,
	MarkConversationReadRequest,
	SendMessageRequest,
	SendMessageResponse,
	SharedRoutine,
	StartConversationRequest,
	UnreadConversationsResponse,
	UpdateMessagePermissionRequest,
	UserProfile,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

const CONVERSATIONS_API_URL = '/conversations'

const page = (url: string, cursor: string | null) =>
	cursor
		? `${url}${url.includes('?') ? '&' : '?'}cursor=${encodeURIComponent(cursor)}`
		: url

/** MSG-01: the signed-in member's conversations and their messages. */
export const messageService = {
	listConversations: (cursor: string | null, box: ConversationBox = 'INBOX') =>
		httpClient.request<ConversationsResponse>(
			page(
				box === 'REQUESTS'
					? `${CONVERSATIONS_API_URL}?box=REQUESTS`
					: CONVERSATIONS_API_URL,
				cursor,
			),
			{ method: 'GET', secure: true },
		),

	/** MSG-02: the recipient takes a request into their inbox. */
	acceptRequest: (conversationId: string) =>
		httpClient.request<void>(
			`${CONVERSATIONS_API_URL}/${encodeURIComponent(conversationId)}/accept`,
			{ method: 'POST', secure: true },
		),

	/** MSG-02: the recipient declines a request; its sender is not told. */
	declineRequest: (conversationId: string) =>
		httpClient.request<void>(
			`${CONVERSATIONS_API_URL}/${encodeURIComponent(conversationId)}/decline`,
			{ method: 'POST', secure: true },
		),

	listMessages: (conversationId: string, cursor: string | null) =>
		httpClient.request<ConversationMessagesResponse>(
			page(
				`${CONVERSATIONS_API_URL}/${encodeURIComponent(conversationId)}/messages`,
				cursor,
			),
			{ method: 'GET', secure: true },
		),

	start: (data: StartConversationRequest) =>
		httpClient.request<SendMessageResponse>(CONVERSATIONS_API_URL, {
			method: 'POST',
			body: JSON.stringify(data),
			secure: true,
		}),

	send: (conversationId: string, data: SendMessageRequest) =>
		httpClient.request<SendMessageResponse>(
			`${CONVERSATIONS_API_URL}/${encodeURIComponent(conversationId)}/messages`,
			{ method: 'POST', body: JSON.stringify(data), secure: true },
		),

	/** MSG-07: the routine a message shared, as it is now. */
	messageRoutine: (conversationId: string, messageId: string) =>
		httpClient.request<SharedRoutine>(
			`${CONVERSATIONS_API_URL}/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/routine`,
			{ method: 'GET', secure: true },
		),

	deleteMessage: (conversationId: string, messageId: string) =>
		httpClient.request<ConversationMessage>(
			`${CONVERSATIONS_API_URL}/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
			{ method: 'DELETE', secure: true },
		),

	deleteConversation: (conversationId: string) =>
		httpClient.request<void>(
			`${CONVERSATIONS_API_URL}/${encodeURIComponent(conversationId)}`,
			{ method: 'DELETE', secure: true },
		),

	/** MSG-03: conversations with something new, for the navigation. */
	unreadCount: () =>
		httpClient.request<UnreadConversationsResponse>(
			`${CONVERSATIONS_API_URL}/unread`,
			{ method: 'GET', secure: true },
		),

	/** MSG-03: the reader has seen up to this message. */
	markRead: (conversationId: string, data: MarkConversationReadRequest) =>
		httpClient.request<void>(
			`${CONVERSATIONS_API_URL}/${encodeURIComponent(conversationId)}/read`,
			{ method: 'POST', body: JSON.stringify(data), secure: true },
		),

	updatePermission: (data: UpdateMessagePermissionRequest) =>
		httpClient.request<UserProfile>('/users/preferences/messages', {
			method: 'PUT',
			body: JSON.stringify(data),
			secure: true,
		}),
}
