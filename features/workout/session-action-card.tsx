'use client'

import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
		// Final review 4 / §11.8: an inline control row directly under the
		// masthead, not a boxed "metric card plus giant button". The progress bar
		// and percentage it used to carry restated what the masthead already
		// shows, so overall progress is now stated exactly once on this screen.
		<section
			aria-label="Session actions"
			className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
		>
			{/* Completion Status */}
			{!isComplete ? (
				<div className="mark mark-warning flex items-center gap-2 bg-surface-sunk py-2 pl-3 pr-3">
					<AlertCircle
						className="h-4 w-4 shrink-0 text-warning-strong"
						aria-hidden
					/>
					<p className="type-body-sm text-ink-2">
						Complete all sets to finish the session
					</p>
				</div>
			) : (
				<span className="hidden sm:block" />
			)}

			{/* Finish is the region's one filled control, in ink (§4.3 rule 1);
			    Discard destroys data, so it is the destructive outline (rule 5).
			    Sized to their labels rather than stretched across the column. */}
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onDiscardAttempt}
					disabled={isFinishing}
					className="type-button h-11 rounded-sm border-destructive/50 bg-transparent text-destructive shadow-none transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-destructive/10 hover:text-destructive md:h-10"
				>
					<Trash2 className="mr-2 h-4 w-4" aria-hidden />
					Discard
				</Button>
				<Button
					type="button"
					onClick={onFinishAttempt}
					disabled={isFinishing}
					className="type-button h-11 flex-1 rounded-sm bg-primary text-primary-foreground shadow-none transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-primary-hover sm:flex-none md:h-10"
				>
					{isFinishing ? (
						<>
							<AlertCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden />
							Finishing...
						</>
					) : isComplete ? (
						<>
							<CheckCircle className="mr-2 h-4 w-4" aria-hidden />
							Finish Session
						</>
					) : (
						'Finish Session'
					)}
				</Button>
			</div>
		</section>
	)
}
