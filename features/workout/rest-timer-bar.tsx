'use client'

import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	formatRestTime,
	REST_TIMER_EXTEND_SECONDS,
	restProgress,
} from '@/lib/utils/rest-timer.utils'

interface RestTimerBarProps {
	remaining: number | null
	total: number
	isOver: boolean
	onExtend: () => void
	onDismiss: () => void
}

/**
 * Rest countdown pinned to the bottom of the session, where a thumb reaches it.
 *
 * It stays on screen after reaching zero instead of disappearing: the alert can
 * be missed in a loud gym, so the bar itself has to say that rest is over until
 * the next set is logged or it is dismissed.
 */
export const RestTimerBar = ({
	remaining,
	total,
	isOver,
	onExtend,
	onDismiss,
}: RestTimerBarProps) => {
	if (remaining === null) return null

	const progress = restProgress(remaining, total)

	return (
		// Fixed chrome, not an overlay, so it separates by a rule rather than a
		// shadow (§8) and is opaque rather than blurred.
		<div
			className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface"
			style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
		>
			{/* Elapsed fraction, drawn as a hairline so the bar stays readable
			    at a glance from arm's length. Rest ending is a system state, not
			    an earned mark, so it takes `success` and never gold. */}
			<div className="h-1 w-full bg-surface-sunk">
				{/* Motion spec §1.2/§2.8: `scaleX`, never `width`. This ticks once a
				    second for the length of a rest interval, on the screen that
				    re-renders most broadly (TD-07) - animating width would relayout
				    the document on every tick. */}
				<div
					className={`h-full w-full origin-left transition-transform duration-[var(--motion-base)] ease-linear ${
						isOver ? 'bg-success' : 'bg-ink-3'
					}`}
					style={{ transform: `scaleX(${progress})` }}
				/>
			</div>

			<div className="ledger-page flex items-center gap-3 py-3">
				<div className="flex flex-col">
					<span className="type-label text-ink-3">
						{isOver ? 'Rest over' : 'Resting'}
					</span>
					<span
						// Announce the end once, rather than reading every tick aloud.
						aria-live={isOver ? 'polite' : 'off'}
						// A countdown must be tabular or the digits shuffle every
						// second; Space Mono is monospaced, so it is by construction.
						className={`type-data-strong text-2xl leading-tight ${
							isOver ? 'text-success' : 'text-foreground'
						}`}
					>
						{formatRestTime(remaining)}
					</span>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onExtend}
						aria-label={`Add ${REST_TIMER_EXTEND_SECONDS} seconds to the rest timer`}
						className="type-button h-9 rounded-sm border-rule bg-transparent text-foreground shadow-none hover:bg-muted"
					>
						<Plus className="mr-1 h-4 w-4" aria-hidden />
						{REST_TIMER_EXTEND_SECONDS}s
					</Button>
					{/* The `classical` gold-gradient variant is retired in v0.1 — gold
					    never fills a control. This is not the region's primary action
					    either, so it stays quiet rather than becoming a second crimson. */}
					<Button
						variant="outline"
						size="sm"
						onClick={onDismiss}
						aria-label={isOver ? 'Dismiss the rest timer' : 'Skip the rest'}
						className={`type-button h-9 rounded-sm shadow-none ${
							isOver
								? 'border-success bg-transparent text-success hover:bg-success/10'
								: 'border-rule bg-transparent text-foreground hover:bg-muted'
						}`}
					>
						<X className="mr-1 h-4 w-4" aria-hidden />
						{isOver ? 'Done' : 'Skip'}
					</Button>
				</div>
			</div>
		</div>
	)
}
