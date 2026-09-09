'use client'

import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { SessionProgressData } from '@/lib/utils/workout-session.types'

interface SessionActionCardProps {
	sessionId: string
	routineName: string
	dayName: string
	startedAt: string
	progressData: SessionProgressData
	isFinishing: boolean
	onFinishAttempt: () => void
	onDiscardAttempt: () => void
	onNavigateBack: () => void
}

/**
 * Reusable component for displaying session information and primary actions
 */
export const SessionActionCard = ({
	progressData,
	isFinishing,
	onFinishAttempt,
	onDiscardAttempt,
}: SessionActionCardProps) => {
	const { percentage } = progressData
	const isComplete = percentage === 100

	return (
		// One of the three things v0.1 keeps boxed: the single genuine call to
		// action on the screen (§11.5). `panel` = surface, 2px radius, 1px rule,
		// no shadow.
		<section className="rounded-sm border border-rule bg-surface p-4 md:p-6">
			{/* Progress */}
			<div className="space-y-2">
				<div className="flex items-baseline justify-between">
					<span className="type-label text-ink-3">Progress</span>
					<span className="type-data type-data-strong text-foreground">
						{Math.round(percentage)}%
					</span>
				</div>
				{/* Completion is earned, so the fill is gold. Track is a well and the
				    bar is square — nothing in this direction is a pill. The Radix
				    primitive stays: it carries the progressbar role and value, which
				    a plain div would drop. */}
				<Progress
					value={percentage}
					className="h-1.5 rounded-none bg-surface-sunk [&_[data-slot=progress-indicator]]:bg-honour-bright [&_[data-slot=progress-indicator]]:transition-[transform] [&_[data-slot=progress-indicator]]:duration-[var(--motion-slow)] [&_[data-slot=progress-indicator]]:ease-standard"
				/>
			</div>

			{/* The one action on this region, so it is the one crimson fill
			    (§4.3 rule 1). Gold never fills a control (rule 6). */}
			<div className="mt-5 flex gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onDiscardAttempt}
					disabled={isFinishing}
					className="type-button h-11 rounded-sm border-destructive/50 bg-transparent text-destructive shadow-none transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
				>
					<Trash2 className="mr-2 h-4 w-4" aria-hidden />
					Discard
				</Button>
				<Button
					type="button"
					onClick={onFinishAttempt}
					disabled={isFinishing}
					className="type-button h-11 flex-1 rounded-sm bg-primary text-primary-foreground shadow-none transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-primary-hover disabled:opacity-60"
				>
					{isFinishing ? (
						<>
							<AlertCircle className="mr-2 h-4 w-4 animate-spin" />
							Finishing...
						</>
					) : isComplete ? (
						<>
							<CheckCircle className="mr-2 h-4 w-4" />
							Finish Session
						</>
					) : (
						'Finish Session'
					)}
				</Button>
			</div>

			{/* Completion Status */}
			{!isComplete && (
				<div className="mt-4 flex items-center gap-2 border-l-2 border-warning-strong bg-surface-sunk py-2 pl-3">
					<AlertCircle className="h-4 w-4 shrink-0 text-ink-2" />
					<p className="text-xs text-ink-2">
						Complete all sets to finish the session
					</p>
				</div>
			)}
		</section>
	)
}
