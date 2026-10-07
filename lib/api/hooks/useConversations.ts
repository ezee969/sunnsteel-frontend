import type {
	ConversationBox,
	ConversationMessagesResponse,
	ConversationsResponse,
	MessagePermission,
	SendMessageRequest,
	SendMessageResponse,
	SharedRoutine,
	SharedWorkout,
	UserProfile,
} from '@sunsteel/contracts'
import {
	type InfiniteData,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import { useRealtimeLive } from '@/lib/realtime/realtime-status'
import {
	conversationListFromPages,
	threadFromPages,
} from '@/lib/utils/messages'

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
	/** MSG-02: one box of the list; `list()` stays the prefix for both. */
	box: (box: ConversationBox) => ['conversations', 'list', box] as const,
	unread: () => ['conversations', 'unread'] as const,
	thread: (id: string) => ['conversations', 'thread', id] as const,
	/** MSG-07: a routine a message shared, inside the topic's prefix. */
	routine: (conversationId: string, messageId: string) =>
		['conversations', 'routine', conversationId, messageId] as const,
	/** MSG-10: a workout a message shared. */
	workout: (conversationId: string, messageId: string) =>
		['conversations', 'workout', conversationId, messageId] as const,
}

/** While the realtime stream is not live, how often an open screen re-reads. */
const LIST_POLL_MS = 60_000
const THREAD_POLL_MS = 20_000

/**
 * The member's conversations, newest activity first, a page at a time: the
 * inbox, or (MSG-02) the requests waiting for them.
 */
export function useConversations(box: ConversationBox = 'INBOX') {
	const live = useRealtimeLive()
	return useInfiniteQuery({
		queryKey: conversationKeys.box(box),
		queryFn: ({ pageParam }) =>
			messageService.listConversations(pageParam, box),
		initialPageParam: null as string | null,
		getNextPageParam: (last: ConversationsResponse) => last.nextCursor,
		select: conversationListFromPages,
		staleTime: 30_000,
		refetchOnWindowFocus: true,
		refetchInterval: live ? false : LIST_POLL_MS,
	})
}

/**
 * MSG-03: how many conversations have something new. The shell reads it on
 * every page, so it is one small read the `conversations` signal refreshes,
 * and it polls only while the stream is not live.
 */
export function useUnreadConversations(enabled = true) {
	const live = useRealtimeLive()
	return useQuery({
		queryKey: conversationKeys.unread(),
		queryFn: messageService.unreadCount,
		select: data => data.unreadConversations,
		enabled,
		staleTime: 30_000,
		refetchOnWindowFocus: true,
		refetchInterval: live ? false : LIST_POLL_MS,
	})
}

/** MSG-02: requests waiting for the member, for the Requests tab only. */
export function useConversationRequestCount() {
	const live = useRealtimeLive()
	return useQuery({
		queryKey: conversationKeys.unread(),
		queryFn: messageService.unreadCount,
		select: data => data.requests,
		staleTime: 30_000,
		refetchOnWindowFocus: true,
		refetchInterval: live ? false : LIST_POLL_MS,
	})
}

/**
 * MSG-02: accepting or declining a request moves it between the boxes and
 * changes the counts, so every conversation read is refreshed.
 */
function useRequestDecision(run: (conversationId: string) => Promise<void>) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: run,
		onSuccess: () =>
			void queryClient.invalidateQueries({ queryKey: conversationKeys.all() }),
	})
}

export function useAcceptRequest() {
	return useRequestDecision(messageService.acceptRequest)
}

export function useDeclineRequest() {
	return useRequestDecision(messageService.declineRequest)
}

/**
 * MSG-03: the reader has seen up to a message. The list and the count change;
 * the open thread is left alone, so its "new since you last looked" stays
 * where it was for the rest of the visit.
 */
export function useMarkConversationRead(conversationId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (through: string) =>
			messageService.markRead(conversationId, { through }),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: conversationKeys.unread(),
			})
			void queryClient.invalidateQueries({ queryKey: conversationKeys.list() })
			void queryClient.invalidateQueries({
				queryKey: conversationKeys.unread(),
			})
		},
	})
}

/**
 * One conversation's messages. Pages run newest first and the thread reads
 * oldest first; older pages load as the reader asks for them.
 */
export function useConversationThread(conversationId: string, enabled = true) {
	const live = useRealtimeLive()
	return useInfiniteQuery({
		enabled,
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
		mutationFn: (content: SendMessageRequest) =>
			messageService.send(conversationId, content),
		onSuccess: sent => {
			queryClient.setQueryData<ThreadPages>(
				conversationKeys.thread(conversationId),
				pages => withSent(pages, sent),
			)
			void queryClient.invalidateQueries({ queryKey: conversationKeys.list() })
			void queryClient.invalidateQueries({
				queryKey: conversationKeys.unread(),
			})
		},
	})
}

/**
 * MSG-07: the routine a message shared, read as it is now. `staleTime: 0`,
 * as a shared link's read is: a deleted message or routine must stop
 * resolving at once.
 */
export function useMessageRoutine(conversationId: string, messageId: string) {
	return useQuery<SharedRoutine>({
		queryKey: conversationKeys.routine(conversationId, messageId),
		queryFn: () => messageService.messageRoutine(conversationId, messageId),
		enabled: !!conversationId && !!messageId,
		staleTime: 0,
		retry: false,
	})
}

/** MSG-10: the workout a message shared, read as it is now. */
export function useMessageWorkout(conversationId: string, messageId: string) {
	return useQuery<SharedWorkout>({
		queryKey: conversationKeys.workout(conversationId, messageId),
		queryFn: () => messageService.messageWorkout(conversationId, messageId),
		enabled: !!conversationId && !!messageId,
		staleTime: 0,
		retry: false,
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
			void queryClient.invalidateQueries({
				queryKey: conversationKeys.unread(),
			})
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
			void queryClient.invalidateQueries({
				queryKey: conversationKeys.unread(),
			})
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
