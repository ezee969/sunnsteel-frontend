import {
	parseRealtimeEvent,
	REALTIME_UNAVAILABLE_RETRY_SECONDS,
	type RealtimeEvent,
} from '@sunsteel/contracts'

/**
 * MSG-06: the pure half of the client's realtime stream -- reading Server-Sent
 * Events out of a byte stream, and how long to wait before reconnecting. The
 * loop that owns the connection is `useRealtimeStream`.
 */

/**
 * Splits streamed text into events and returns each one's `data`. A chunk can
 * end anywhere, so an unfinished event waits for the next chunk; comment
 * lines (the server's heartbeat) and fields other than `data` are ignored.
 */
export function createSseReader() {
	let buffer = ''
	return {
		push(chunk: string): string[] {
			buffer += chunk.replace(/\r\n?/g, '\n')
			const payloads: string[] = []
			let end = buffer.indexOf('\n\n')
			while (end >= 0) {
				const block = buffer.slice(0, end)
				buffer = buffer.slice(end + 2)
				const data = block
					.split('\n')
					.filter(line => line.startsWith('data:'))
					.map(line => line.slice(5).replace(/^ /, ''))
				if (data.length) payloads.push(data.join('\n'))
				end = buffer.indexOf('\n\n')
			}
			return payloads
		},
	}
}

/** The events in one chunk, dropping anything this client does not know. */
export function readRealtimeEvents(
	reader: ReturnType<typeof createSseReader>,
	chunk: string,
): RealtimeEvent[] {
	return reader.push(chunk).flatMap(data => {
		const event = parseRealtimeEvent(data)
		return event ? [event] : []
	})
}

const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000, 30_000]

/**
 * A stream open this long was healthy: ending it reconnects at once and the
 * backoff starts again. One that ends sooner is treated as a failure, so a
 * member over the per-member limit cannot make two tabs close each other in
 * a tight loop.
 */
export const HEALTHY_STREAM_MS = 60_000

export type StreamOutcome =
	/** The stream opened and the server ended it (its lifetime or token). */
	| { kind: 'ended'; openForMs: number }
	/** The server answered without a stream. */
	| { kind: 'refused'; status: number; retryAfterSeconds: number | null }
	/** The network failed or the stream broke. */
	| { kind: 'failed'; openForMs: number }

/** Whether the stream was healthy long enough to start the backoff again. */
export function wasHealthy(outcome: StreamOutcome): boolean {
	return outcome.kind !== 'refused' && outcome.openForMs >= HEALTHY_STREAM_MS
}

/**
 * How long to wait before the next attempt. A healthy stream the server ended
 * on purpose reconnects at once; a switched-off server is asked again after
 * its `Retry-After` (not exposed cross-origin, so usually the default); a
 * throttled one after a minute; anything else backs off, with jitter so a
 * deploy does not bring every tab back in the same second.
 */
export function reconnectDelayMs(
	outcome: StreamOutcome,
	failures: number,
	random: () => number = Math.random,
): number {
	if (outcome.kind === 'ended' && wasHealthy(outcome)) return 0
	if (outcome.kind === 'refused') {
		if (outcome.status === 503) {
			return (
				(outcome.retryAfterSeconds ?? REALTIME_UNAVAILABLE_RETRY_SECONDS) * 1000
			)
		}
		if (outcome.status === 429) return 60_000
	}
	const base = BACKOFF_MS[Math.min(failures, BACKOFF_MS.length - 1)]
	return Math.round(base * (0.8 + 0.4 * random()))
}

/** `Retry-After` in seconds, or null when absent or a date. */
export function retryAfterSeconds(value: string | null): number | null {
	if (!value || !/^\d+$/.test(value.trim())) return null
	return Number(value.trim())
}

/** NOTIF-01's five-minute poll, paused while the stream delivers changes. */
export const NOTIFICATIONS_POLL_MS = 5 * 60_000

export function notificationsPollInterval(live: boolean): number | false {
	return live ? false : NOTIFICATIONS_POLL_MS
}
