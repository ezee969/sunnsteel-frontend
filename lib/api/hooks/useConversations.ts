import type {
	ConversationMessagesResponse,
	ConversationsResponse,
	MessagePermission,
	SendMessageResponse,
	UserProfile,
} from '@sunsteel/contracts'
import {
	type InfiniteData,
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'

import { useRealtimeLive } from '@/lib/realtime/realtime-status'
import { flattenConversationPages, threadFromPages } from '@/lib/utils/messages'

import { messageService } from '../services/messageService'

type ThreadPages = InfiniteData<ConversationMessagesResponse, string | null>

/**
 * MSG-01. Everything under `['conversations']`, so the MSG-06 `conversations`
 * signal (one invalidation of the prefix) refreshes the list and every
 * thread on screen.
 */
export const conversationKeys = {
	all: () => ['conversations'] as const,
	list: () => ['conversations', 'list'] as const,
	thread: (id: string) => ['conversations', 'thread', id] as const,
}

/** While the realtime stream is not live, how often an open screen re-reads. */
const LIST_POLL_MS = 60_000
const THREAD_POLL_MS = 20_000

/** The member's conversations, newest activity first, a page at a time. */
export function useConversations() {
	const live = useRealtimeLive()
	return useInfiniteQuery({
		queryKey: conversationKeys.list(),
		queryFn: ({ pageParam }) => messageService.listConversations(pageParam),
		initialPageParam: null as string | null,
		getNextPageParam: (last: ConversationsResponse) => last.nextCursor,
		select: flattenConversationPages,
		staleTime: 30_000,
		refetchOnWindowFocus: true,
		refetchInterval: live ? false : LIST_POLL_MS,
	})
}

/**
 * One conversation's messages. Pages run newest first and the thread reads
 * oldest first; older pages load as the reader asks for them.
 */
export function useConversationThread(conversationId: string) {
	const live = useRealtimeLive()
	return useInfiniteQuery({
		queryKey: conversationKeys.thread(conversationId),
		queryFn: ({ pageParam }) =>
			messageService.listMessages(conversationId, pageParam),
		initialPageParam: null as string | null,
		getNextPageParam: (last: ConversationMessagesResponse) => last.nextCursor,
		select: threadFromPages,
		staleTime: 10_000,
		refetchOnWindowFocus: true,
		refetchInterval: live ? false : THREAD_POLL_MS,
		retry: false,
	})
}

/** Puts a sent message at the newest end of a loaded thread. */
function withSent(pages: ThreadPages | undefined, sent: SendMessageResponse) {
	if (!pages || pages.pages.length === 0) return pages
	const [first, ...rest] = pages.pages
	if (first.messages.some(message => message.id === sent.message.id)) {
		return pages
	}
	return {
		...pages,
		pages: [
			{
				...first,
				conversation: sent.conversation,
				messages: [sent.message, ...first.messages],
			},
			...rest,
		],
	}
}

export function useStartConversation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: messageService.start,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: conversationKeys.all() })
			// A profile's Message action now opens the conversation it started.
			void queryClient.invalidateQueries({ queryKey: ['users', 'public'] })
		},
	})
}

export function useSendMessage(conversationId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (body: string) => messageService.send(conversationId, { body }),
		onSuccess: sent => {
			queryClient.setQueryData<ThreadPages>(
				conversationKeys.thread(conversationId),
				pages => withSent(pages, sent),
			)
			void queryClient.invalidateQueries({ queryKey: conversationKeys.list() })
		},
	})
}

export function useDeleteMessage(conversationId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (messageId: string) =>
			messageService.deleteMessage(conversationId, messageId),
		onSuccess: deleted => {
			queryClient.setQueryData<ThreadPages>(
				conversationKeys.thread(conversationId),
				pages =>
					pages && {
						...pages,
						pages: pages.pages.map(page => ({
							...page,
							messages: page.messages.map(message =>
								message.id === deleted.id ? deleted : message,
							),
						})),
					},
			)
			void queryClient.invalidateQueries({ queryKey: conversationKeys.list() })
		},
	})
}

export function useDeleteConversation() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (conversationId: string) =>
			messageService.deleteConversation(conversationId),
		onSuccess: (_result, conversationId) => {
			queryClient.removeQueries({
				queryKey: conversationKeys.thread(conversationId),
			})
			void queryClient.invalidateQueries({ queryKey: conversationKeys.list() })
		},
	})
}

/** Who may start a conversation with this member (Settings › Privacy). */
export function useUpdateMessagePermission() {
	const queryClient = useQueryClient()
	return useMutation<UserProfile, Error, MessagePermission>({
		mutationFn: messagePermission =>
			messageService.updatePermission({ messagePermission }),
		onSuccess: profile => queryClient.setQueryData(['user'], profile),
	})
}
