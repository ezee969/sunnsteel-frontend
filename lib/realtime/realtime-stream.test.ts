import { REALTIME_UNAVAILABLE_RETRY_SECONDS } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	createSseReader,
	HEALTHY_STREAM_MS,
	NOTIFICATIONS_POLL_MS,
	notificationsPollInterval,
	readRealtimeEvents,
	reconnectDelayMs,
	retryAfterSeconds,
} from './realtime-stream'

describe('MSG-06 reading the stream', () => {
	it('returns each event once it is complete, wherever a chunk ends', () => {
		const reader = createSseReader()
		expect(reader.push('data: {"type":"ready","top')).toEqual([])
		expect(reader.push('ics":["notifications"]}\n')).toEqual([])
		expect(reader.push('\ndata: one\n\ndata: two\n\n')).toEqual([
			'{"type":"ready","topics":["notifications"]}',
			'one',
			'two',
		])
	})

	it('ignores the heartbeat and other fields, and reads CRLF', () => {
		const reader = createSseReader()
		expect(
			reader.push(
				': keep-alive\n\nevent: x\r\nid: 3\r\ndata: a\r\ndata: b\r\n\r\n',
			),
		).toEqual(['a\nb'])
	})

	it('keeps only events this client knows', () => {
		const reader = createSseReader()
		expect(
			readRealtimeEvents(
				reader,
				'data: {"type":"changed","topic":"notifications"}\n\n' +
					'data: {"type":"changed","topic":"unknown"}\n\n' +
					'data: not json\n\n',
			),
		).toEqual([{ type: 'changed', topic: 'notifications' }])
	})
})

describe('MSG-06 reconnecting', () => {
	const half = () => 0.5

	it('reconnects at once after a healthy stream the server ended', () => {
		expect(
			reconnectDelayMs(
				{ kind: 'ended', openForMs: HEALTHY_STREAM_MS },
				3,
				half,
			),
		).toBe(0)
	})

	it('backs off after a stream that ended at once, so two tabs over the limit cannot loop', () => {
		expect(reconnectDelayMs({ kind: 'ended', openForMs: 200 }, 0, half)).toBe(
			1_000,
		)
	})

	it('backs off further with each failure, capped, with jitter around it', () => {
		const failed = { kind: 'failed', openForMs: 0 } as const
		expect(
			[0, 1, 2, 3, 4, 9].map(n => reconnectDelayMs(failed, n, half)),
		).toEqual([1_000, 2_000, 5_000, 10_000, 30_000, 30_000])
		expect(reconnectDelayMs(failed, 0, () => 0)).toBe(800)
		expect(reconnectDelayMs(failed, 0, () => 1)).toBe(1_200)
	})

	it('waits out a switched-off server and a throttled one', () => {
		expect(
			reconnectDelayMs(
				{ kind: 'refused', status: 503, retryAfterSeconds: null },
				0,
				half,
			),
		).toBe(REALTIME_UNAVAILABLE_RETRY_SECONDS * 1000)
		expect(
			reconnectDelayMs(
				{ kind: 'refused', status: 503, retryAfterSeconds: 30 },
				0,
				half,
			),
		).toBe(30_000)
		expect(
			reconnectDelayMs(
				{ kind: 'refused', status: 429, retryAfterSeconds: null },
				0,
				half,
			),
		).toBe(60_000)
		expect(
			reconnectDelayMs(
				{ kind: 'refused', status: 401, retryAfterSeconds: null },
				1,
				half,
			),
		).toBe(2_000)
	})

	it('reads Retry-After seconds and nothing else', () => {
		expect(retryAfterSeconds('120')).toBe(120)
		expect(retryAfterSeconds(null)).toBeNull()
		expect(retryAfterSeconds('Wed, 21 Oct 2026 07:28:00 GMT')).toBeNull()
	})
})

describe('MSG-06 the bell while live', () => {
	it('polls every five minutes only while the stream is not live', () => {
		expect(notificationsPollInterval(false)).toBe(NOTIFICATIONS_POLL_MS)
		expect(NOTIFICATIONS_POLL_MS).toBe(5 * 60_000)
		expect(notificationsPollInterval(true)).toBe(false)
	})
})
