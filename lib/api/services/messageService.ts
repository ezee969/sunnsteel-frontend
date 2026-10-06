import type {
	ConversationMessage,
	ConversationMessagesResponse,
	ConversationsResponse,
	MarkConversationReadRequest,
	SendMessageRequest,
	SendMessageResponse,
	StartConversationRequest,
	UnreadConversationsResponse,
	UpdateMessagePermissionRequest,
	UserProfile,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

const CONVERSATIONS_API_URL = '/conversations'

const page = (url: string, cursor: string | null) =>
	cursor ? `${url}?cursor=${encodeURIComponent(cursor)}` : url

/** MSG-01: the signed-in member's conversations and their messages. */
export const messageService = {
	listConversations: (cursor: string | null) =>
		httpClient.request<ConversationsResponse>(
			page(CONVERSATIONS_API_URL, cursor),
			{ method: 'GET', secure: true },
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
