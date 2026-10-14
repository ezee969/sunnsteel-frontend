import type { Translator } from '@/i18n/translator'

/**
 * TRUST-03: what the shell says about the connection. Nothing here is stored
 * durably (that is `OFFLINE-01`): a change made while offline is a write
 * TanStack Query has paused in this tab's memory, so it is sent when the
 * connection comes back only while the page stays open, and the copy says so.
 *
 * - `offline`: no connection; `waiting` writes are paused until it returns.
 * - `sending`: back online, and the writes that waited are on their way.
 * - `sent`: back online and every write that waited went through.
 * - `failed`: back online, but some of them were refused or failed; the place
 *   each belongs to says which and offers Try again.
 */
export type ConnectionNotice =
	| { kind: 'offline'; waiting: number }
	| { kind: 'sending'; waiting: number }
	| { kind: 'sent' }
	| { kind: 'failed'; failed: number }

export interface ConnectionFacts {
	online: boolean
	/** Writes paused for the connection. */
	waiting: number
	/** Writes running now (sent, not yet answered). */
	running: number
	/**
	 * Since the connection last came back: whether anything had waited for
	 * it, and how many writes failed. Null when it has not dropped.
	 */
	reconnect: { hadWaiting: boolean; failed: number } | null
}

export function connectionNotice(
	facts: ConnectionFacts,
): ConnectionNotice | null {
	if (!facts.online) return { kind: 'offline', waiting: facts.waiting }
	if (!facts.reconnect?.hadWaiting) return null
	const unfinished = facts.waiting + facts.running
	if (unfinished > 0) return { kind: 'sending', waiting: unfinished }
	if (facts.reconnect.failed > 0)
		return { kind: 'failed', failed: facts.reconnect.failed }
	return { kind: 'sent' }
}

/** How long "sent" stays before the line goes away. */
export const CONNECTION_SENT_DWELL_MS = 4000

export function connectionLine(
	notice: ConnectionNotice,
	t: Translator<'shell.connection'>,
): string {
	switch (notice.kind) {
		case 'offline':
			return notice.waiting > 0
				? t('offlineWaiting', { count: notice.waiting })
				: t('offline')
		case 'sending':
			return t('sending', { count: notice.waiting })
		case 'sent':
			return t('sent')
		case 'failed':
			return t('failed', { count: notice.failed })
	}
}

/** Leaving would drop writes that only live in this page's memory. */
export function leavingLosesChanges(waiting: number): boolean {
	return waiting > 0
}
