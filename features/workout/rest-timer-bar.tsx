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
		<div
			className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm shadow-lg"
			style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
		>
			{/* Elapsed fraction, drawn as a hairline so the bar stays readable
			    at a glance from arm's length. */}
			<div className="h-1 w-full bg-muted">
				<div
					className={`h-full transition-[width] duration-200 ease-linear ${
						isOver ? 'bg-green-500' : 'bg-amber-500'
					}`}
					style={{ width: `${Math.round(progress * 100)}%` }}
				/>
			</div>

			<div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
				<div className="flex flex-col">
					<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
						{isOver ? 'Rest over' : 'Resting'}
					</span>
					<span
						// Announce the end once, rather than reading every tick aloud.
						aria-live={isOver ? 'polite' : 'off'}
						className={`text-2xl font-bold tabular-nums heading-classical ${
							isOver ? 'text-green-600 dark:text-green-400' : ''
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
					>
						<Plus className="mr-1 h-4 w-4" aria-hidden />
						{REST_TIMER_EXTEND_SECONDS}s
					</Button>
					<Button
						variant={isOver ? 'classical' : 'secondary'}
						size="sm"
						onClick={onDismiss}
						aria-label={isOver ? 'Dismiss the rest timer' : 'Skip the rest'}
					>
						<X className="mr-1 h-4 w-4" aria-hidden />
						{isOver ? 'Done' : 'Skip'}
					</Button>
				</div>
			</div>
		</div>
	)
}
