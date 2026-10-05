import type { RealtimeEvent, RealtimeTopic } from '@sunsteel/contracts'
import { type QueryKey, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { setRealtimeLive } from '@/lib/realtime/realtime-status'
import {
	createSseReader,
	readRealtimeEvents,
	reconnectDelayMs,
	retryAfterSeconds,
	type StreamOutcome,
	wasHealthy,
} from '@/lib/realtime/realtime-stream'

import { realtimeService } from '../services/realtimeService'
import { notificationKeys } from './useNotifications'

/**
 * What each topic makes stale. A `Record` over the contracts' topics, so a
 * topic added there fails the build until it names the reads it refreshes.
 */
const TOPIC_KEYS: Record<RealtimeTopic, QueryKey> = {
	notifications: notificationKeys.all(),
}

async function readStream(
	signal: AbortSignal,
	onEvent: (event: RealtimeEvent) => void,
): Promise<StreamOutcome | null> {
	let response: Response | null
	try {
		response = await realtimeService.openStream(signal)
	} catch {
		return { kind: 'failed', openForMs: 0 }
	}
	if (!response) return null
	if (!response.ok || !response.body) {
		return {
			kind: 'refused',
			status: response.status,
			retryAfterSeconds: retryAfterSeconds(response.headers.get('Retry-After')),
		}
	}
	const openedAt = Date.now()
	const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
	const sse = createSseReader()
	try {
		for (;;) {
			const { value, done } = await reader.read()
			if (done) return { kind: 'ended', openForMs: Date.now() - openedAt }
			for (const event of readRealtimeEvents(sse, value)) onEvent(event)
		}
	} catch {
		return { kind: 'failed', openForMs: Date.now() - openedAt }
	}
}

/**
 * MSG-06: holds this tab's realtime stream while a member is signed in. A
 * `ready` event (every new stream) and each `changed` signal make the topic's
 * reads stale, which refetches the ones on screen; a read already in flight
 * is left to finish rather than restarted, because the change that signalled
 * it is what that read is fetching. The stream reconnects by
 * `reconnectDelayMs`, sooner when the tab comes back or the network returns,
 * and while it is not live the reads keep polling.
 *
 * `accountKey` restarts the stream when the account changes.
 */
export function useRealtimeStream(accountKey: string | null) {
	const queryClient = useQueryClient()

	useEffect(() => {
		if (!accountKey) return
		const controller = new AbortController()
		let wake: (() => void) | null = null
		const wakeUp = () => wake?.()
		const onVisibility = () => {
			if (document.visibilityState === 'visible') wakeUp()
		}
		window.addEventListener('online', wakeUp)
		document.addEventListener('visibilitychange', onVisibility)

		const onEvent = (event: RealtimeEvent) => {
			const topics = event.type === 'ready' ? event.topics : [event.topic]
			if (event.type === 'ready') setRealtimeLive(true)
			for (const topic of topics) {
				void queryClient.invalidateQueries(
					{ queryKey: TOPIC_KEYS[topic] },
					{ cancelRefetch: false },
				)
			}
		}

		const sleep = (ms: number) =>
			new Promise<void>(resolve => {
				const done = () => {
					clearTimeout(timer)
					wake = null
					controller.signal.removeEventListener('abort', done)
					resolve()
				}
				const timer = setTimeout(done, ms)
				wake = done
				controller.signal.addEventListener('abort', done)
			})

		const run = async () => {
			let failures = 0
			while (!controller.signal.aborted) {
				const outcome = await readStream(controller.signal, onEvent)
				setRealtimeLive(false)
				// No session: nothing to stream until the account changes.
				if (!outcome || controller.signal.aborted) return
				if (wasHealthy(outcome)) failures = 0
				const delay = reconnectDelayMs(outcome, failures)
				if (delay > 0) failures += 1
				await sleep(delay)
			}
		}
		void run()

		return () => {
			controller.abort()
			window.removeEventListener('online', wakeUp)
			document.removeEventListener('visibilitychange', onVisibility)
			setRealtimeLive(false)
		}
	}, [accountKey, queryClient])
}
