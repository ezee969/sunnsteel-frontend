'use client'

import { Check, CloudUpload, WifiOff, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import {
	useFailedWritesSince,
	useOnline,
	useWrites,
} from '@/hooks/use-connection'
import {
	CONNECTION_SENT_DWELL_MS,
	connectionLine,
	type ConnectionNotice,
	connectionNotice,
	leavingLosesChanges,
} from '@/lib/utils/connection'

const GLYPHS: Record<ConnectionNotice['kind'], typeof Check> = {
	offline: WifiOff,
	sending: CloudUpload,
	sent: Check,
	failed: X,
}

const GLYPH_TONES: Record<ConnectionNotice['kind'], string> = {
	offline: 'text-warning-strong',
	sending: 'text-ink-2',
	sent: 'text-success-strong',
	failed: 'text-destructive',
}

/**
 * TRUST-03 (design system §28.8): the shell's one line about the
 * connection, in the §26.6 status band under the topbar. Offline it says so
 * and how many changes wait in this page; back online it says they are being
 * sent, then that they were (for a moment) or how many failed (until the
 * next drop). A glyph and a word, never colour alone. While changes wait,
 * leaving the page asks first, because they live only in its memory.
 */
export function ConnectionStatus() {
	const t = useTranslations('shell.connection')
	const online = useOnline()
	const { waiting, running } = useWrites()
	// When the connection last dropped, and whether anything waited for it.
	const [dropped, setDropped] = useState<{
		at: number
		hadWaiting: boolean
	} | null>(null)
	const [dismissed, setDismissed] = useState(false)
	const failed = useFailedWritesSince(dropped?.at ?? null)

	useEffect(() => {
		if (!online) {
			setDismissed(false)
			// A drop before the last one was reported keeps its start, so the
			// writes that waited through both are still counted.
			setDropped(previous => previous ?? { at: Date.now(), hadWaiting: false })
		}
	}, [online])

	useEffect(() => {
		if (!online && waiting > 0)
			setDropped(previous =>
				previous && !previous.hadWaiting
					? { ...previous, hadWaiting: true }
					: previous,
			)
	}, [online, waiting])

	const notice = dismissed
		? null
		: connectionNotice({
				online,
				waiting,
				running,
				reconnect: dropped ? { hadWaiting: dropped.hadWaiting, failed } : null,
			})

	// "Sent" stays a moment, then the line goes away until the next drop.
	const sentKind = notice?.kind === 'sent'
	useEffect(() => {
		if (!sentKind) return
		const id = window.setTimeout(() => {
			setDropped(null)
		}, CONNECTION_SENT_DWELL_MS)
		return () => window.clearTimeout(id)
	}, [sentKind])

	// Back online with nothing that waited: nothing to report.
	useEffect(() => {
		if (online && dropped && !dropped.hadWaiting) setDropped(null)
	}, [online, dropped])

	const losing = leavingLosesChanges(waiting)
	const losingRef = useRef(losing)
	losingRef.current = losing
	useEffect(() => {
		if (!losing) return
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!losingRef.current) return
			event.preventDefault()
			// Older browsers need a value to show their own prompt.
			event.returnValue = ''
		}
		window.addEventListener('beforeunload', onBeforeUnload)
		return () => window.removeEventListener('beforeunload', onBeforeUnload)
	}, [losing])

	if (!notice) return null
	const Glyph = GLYPHS[notice.kind]
	return (
		<div
			data-slot="connection-status"
			data-state={notice.kind}
			className="flex items-center justify-between gap-3 border-b border-rule bg-surface px-4 py-2 sm:px-6"
		>
			<p
				role="status"
				className="type-body-sm flex min-w-0 items-center gap-2 text-foreground"
			>
				<Glyph
					className={`size-4 shrink-0 ${GLYPH_TONES[notice.kind]}`}
					aria-hidden
				/>
				<span>{connectionLine(notice, t)}</span>
			</p>
			{notice.kind === 'failed' ? (
				<button
					type="button"
					className="type-body-sm shrink-0 rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
					onClick={() => {
						setDismissed(true)
						setDropped(null)
					}}
				>
					{t('dismiss')}
				</button>
			) : null}
		</div>
	)
}
