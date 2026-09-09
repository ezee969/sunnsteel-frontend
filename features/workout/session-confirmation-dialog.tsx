'use client'

import { AlertTriangle, CheckCircle, Target, Trash2 } from 'lucide-react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getSessionResolutionCopy } from '@/lib/utils/session-resolution'
import type {
	SessionProgressData,
	SessionStatus,
} from '@/lib/utils/workout-session.types'

interface SessionConfirmationDialogProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	progressData: SessionProgressData
	routineName: string
	isFinishing: boolean
	status: SessionStatus | null
}

/**
 * Confirmation dialog for finishing workout sessions
 */
export const SessionConfirmationDialog = ({
	isOpen,
	onClose,
	onConfirm,
	progressData,
	routineName,
	isFinishing,
	status,
}: SessionConfirmationDialogProps) => {
	const { completedSets, totalSets, percentage } = progressData
	const isComplete = percentage === 100
	const isDiscarding = status === 'ABORTED'
	const incompleteSets = totalSets - completedSets
	const copy = getSessionResolutionCopy(status)

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			{/* Radix portals this to <body>, outside the section wrapper, so the
			    scope class has to travel with it or the dialog renders on the old
			    greyscale palette. */}
			<AlertDialogContent className="max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="type-section flex items-center gap-2 text-foreground">
						{isDiscarding ? (
							<Trash2 className="h-5 w-5 text-destructive" />
						) : isComplete ? (
							<CheckCircle className="h-5 w-5 text-success" aria-hidden />
						) : (
							<AlertTriangle className="h-5 w-5 text-ink-2" />
						)}
						{copy.title}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-3">
							<p className="text-ink-2">
								{copy.prompt}{' '}
								<span className="text-foreground">{routineName}</span>?
							</p>

							{/* Progress Summary */}
							<div className="space-y-2 bg-surface-sunk p-3">
								<div className="flex items-baseline justify-between">
									<span className="type-label text-ink-3">Progress</span>
									<span
										className={`type-data type-data-strong ${
											isComplete ? 'text-success' : 'text-foreground'
										}`}
									>
										{Math.round(percentage)}%
									</span>
								</div>

								<div className="flex items-center gap-2 text-sm text-ink-2">
									<Target className="h-4 w-4 shrink-0 text-ink-3" />
									<span>
										{completedSets} of {totalSets} sets completed
									</span>
								</div>

								{!isComplete && (
									<div className="flex items-center gap-2 text-sm text-ink-2">
										<AlertTriangle
											className="h-4 w-4 shrink-0 text-warning-strong"
											aria-hidden
										/>
										<span>
											{incompleteSets} set{incompleteSets !== 1 ? 's' : ''}{' '}
											remaining
										</span>
									</div>
								)}
							</div>

							{/* Resolution warning */}
							{isDiscarding ? (
								<div className="mark border-l-destructive bg-surface-sunk p-3">
									<p className="text-sm text-ink-2">
										<strong className="text-destructive">
											Discarding is permanent.
										</strong>{' '}
										This session and its saved sets will not appear in workout
										history.
									</p>
								</div>
							) : !isComplete ? (
								<div className="mark mark-warning bg-surface-sunk p-3">
									<p className="text-sm text-ink-2">
										<strong className="text-ink-2">Note:</strong> Finishing with
										incomplete sets will still save your progress, but you
										won&apos;t get the full benefit of the workout.
									</p>
								</div>
							) : null}

							{/* Success message for complete sessions */}
							{!isDiscarding && isComplete && (
								<div className="mark mark-success bg-surface-sunk p-3">
									<p className="text-sm text-ink-2">
										<strong className="text-success">Great job!</strong>{' '}
										You&apos;ve completed all sets. Your progress will be saved
										and applied to future workouts.
									</p>
								</div>
							)}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					{/* Cancel is quiet, so the one crimson fill in the dialog is
					    unambiguously the thing that proceeds (§4.3 rule 1). */}
					<AlertDialogCancel disabled={isFinishing}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isFinishing}
						className={
							isDiscarding
								? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
								: ''
						}
					>
						{isFinishing ? copy.pendingLabel : copy.confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
