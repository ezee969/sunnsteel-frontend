'use client'

import { onlineManager, useMutationState } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

/**
 * TRUST-03: whether the app can reach the network, as TanStack Query's
 * `onlineManager` sees it -- the same state that pauses a write -- so what
 * the screen says and what the app does never disagree.
 */
export function useOnline(): boolean {
	return useSyncExternalStore(
		onlineManager.subscribe.bind(onlineManager),
		() => onlineManager.isOnline(),
		() => true,
	)
}

/** TRUST-03: writes paused until the connection returns, and those running. */
export function useWrites(): { waiting: number; running: number } {
	const pending = useMutationState({
		filters: { status: 'pending' },
		select: mutation => mutation.state.isPaused,
	})
	const waiting = pending.filter(Boolean).length
	return { waiting, running: pending.length - waiting }
}

/**
 * TRUST-03: how many writes submitted at or after `since` failed. Null
 * `since` counts nothing.
 */
export function useFailedWritesSince(since: number | null): number {
	return useMutationState({
		filters: {
			status: 'error',
			predicate: mutation =>
				since !== null && mutation.state.submittedAt >= since,
		},
	}).length
}
