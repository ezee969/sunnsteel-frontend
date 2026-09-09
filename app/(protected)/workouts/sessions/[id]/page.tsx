'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { ExerciseGroup } from '@/features/workout/exercise-group'
import { ProgressionResultDialog } from '@/features/workout/progression-result-dialog'
import { RestTimerBar } from '@/features/workout/rest-timer-bar'
import { SessionActionCard } from '@/features/workout/session-action-card'
import { SessionConfirmationDialog } from '@/features/workout/session-confirmation-dialog'
import { SessionHeader } from '@/features/workout/session-header'
import { SessionLoadingSkeleton } from '@/features/workout/session-loading-skeleton'
import { useCollapsibleExercises } from '@/hooks/use-collapsible-exercises'
import { useRestTimer } from '@/hooks/use-rest-timer'
import { useScreenWakeLock } from '@/hooks/use-screen-wake-lock'
import { useSessionManagement } from '@/hooks/use-session-management'
import { useRoutine, useUpdateExerciseNote } from '@/lib/api/hooks/useRoutines'
import {
	usePreviousPerformance,
	useSession,
	useUpsertSetLog,
} from '@/lib/api/hooks/useWorkoutSession'
import type { SetLog } from '@/lib/api/types/workout.type'
import { groupSetLogsByExercise } from '@/lib/utils/session-progress.utils'
import type {
	GroupedExerciseLogs,
	UpsertSetLogPayload,
} from '@/lib/utils/workout-session.types'

/**
 * The Phase 4 scope class and shell bleed are gone: Phase 7 landed the palette
 * globally, so this section no longer needs its own copy of it. The screen's
 * remaining v1.0 gaps - the action panel composition, the masthead wrap, field
 * width caps and the micro-caps inside set rows - are Phase 8's batch, listed
 * in docs/ui-design-system.md §14.
 */
const SHELL_CLASS = 'min-h-screen bg-background'

const BACK_BUTTON_CLASS =
	'type-button inline-flex h-10 items-center rounded-sm bg-primary px-6 text-primary-foreground transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-primary-hover'

/**
 * Render the active workout session page with session metadata, progress, finish/abort controls, and editable set logs.
 *
 * Renders a hero, session header (status and start time), a card showing routine name and progress, finish/abort actions with confirmation dialog, and a list of set logs that will be grouped by routine structure when routine metadata is available. Handles saving individual set logs and finishing or aborting the session.
 *
 * @returns The React element tree for the active session UI.
 */
export default function ActiveSessionPage() {
	const params = useParams<{ id: string | string[] }>()
	const router = useRouter()
	const idParam = Array.isArray(params.id) ? params.id[0] : params.id

	// Data fetching
	const { data: session, isLoading, error } = useSession(idParam)
	const { data: previousPerformance, error: previousPerformanceError } =
		usePreviousPerformance(idParam)
	const { mutate: upsertSetLog } = useUpsertSetLog(idParam)
	const { mutate: updateNote } = useUpdateExerciseNote()
	const routineId = session?.routineId ?? ''
	const {
		data: routine,
		isFetched: isRoutineFetched,
		error: routineError,
	} = useRoutine(routineId)

	// LIVE-02: hold the screen awake only while the session is genuinely in
	// progress. Gating on the status rather than the route means finishing or
	// aborting drops the lock immediately, without waiting for the redirect.
	useScreenWakeLock(session?.status === 'IN_PROGRESS')

	// LIVE-01: rest runs off the exercise's own restSeconds, started by the
	// tap that ticks a set complete.
	const restTimer = useRestTimer()

	// Session management
	const {
		isConfirmingFinish,
		progressData,
		handleFinishAttempt,
		executeFinish,
		cancelFinish,
		isFinishing,
		finishStatus,
		progressionChanges,
		completeProgressionReview,
	} = useSessionManagement({
		sessionId: idParam,
		routine,
		routineDayId: session?.routineDayId,
		setLogs: session?.setLogs,
	})

	// Collapsible exercises state
	const { toggleExercise, isCollapsed } = useCollapsibleExercises()

	// Handlers
	const handleSaveSetLog = useCallback(
		(payload: UpsertSetLogPayload) => {
			upsertSetLog(payload)
		},
		[upsertSetLog],
	)

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	// Group set logs by exercise for display
	const groupedLogs = useMemo<GroupedExerciseLogs[]>(() => {
		if (!session?.setLogs || !routine) return [] as GroupedExerciseLogs[]

		const day = routine!.days.find(d => d.id === session.routineDayId)
		if (!day) return [] as GroupedExerciseLogs[]

		return groupSetLogsByExercise(
			session.setLogs as SetLog[],
			day.exercises,
			session.id,
		)
	}, [session?.setLogs, session?.routineDayId, session?.id, routine])
	const previousSets = useMemo(
		() =>
			new Map(
				(previousPerformance?.sets ?? []).map(set => [
					`${set.routineExerciseId}:${set.setNumber}`,
					set,
				]),
			),
		[previousPerformance?.sets],
	)

	// Loading state (session or routine). For routine, wait until first fetch completes when routineId exists
	const routineFirstFetchPending = !!routineId && !isRoutineFetched
	if (isLoading || routineFirstFetchPending) {
		return <SessionLoadingSkeleton />
	}

	// Error state
	if (error) {
		return (
			<div className={SHELL_CLASS}>
				<div className="ledger-page space-y-4 py-16 text-center">
					<h1 className="type-page text-destructive">Error Loading Session</h1>
					<p className="text-ink-2">
						{error.message || 'Failed to load workout session'}
					</p>
					<button onClick={handleBack} className={BACK_BUTTON_CLASS}>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	// No session found
	if (!session) {
		return (
			<div className={SHELL_CLASS}>
				<div className="ledger-page space-y-4 py-16 text-center">
					<h1 className="type-page">Session Not Found</h1>
					<p className="text-ink-2">
						The workout session you&apos;re looking for doesn&apos;t exist or
						has been deleted.
					</p>
					<button onClick={handleBack} className={BACK_BUTTON_CLASS}>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	// Routine error state
	if (routineError) {
		return (
			<div className={SHELL_CLASS}>
				<div className="ledger-page space-y-4 py-16 text-center">
					<h1 className="type-page text-destructive">Error Loading Routine</h1>
					<p className="text-ink-2">
						{routineError.message || 'Failed to load routine'}
					</p>
					<button onClick={handleBack} className={BACK_BUTTON_CLASS}>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	// No routine found (only after routine finished first fetch and routineId exists)
	if (!!routineId && isRoutineFetched && !routine) {
		return (
			<div className={SHELL_CLASS}>
				<div className="ledger-page space-y-4 py-16 text-center">
					<h1 className="type-page">Routine Not Found</h1>
					<p className="text-ink-2">
						The routine associated with this session could not be loaded.
					</p>
					<button onClick={handleBack} className={BACK_BUTTON_CLASS}>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	const day = routine!.days.find(d => d.id === session.routineDayId)
	if (!day) {
		return (
			<div className={SHELL_CLASS}>
				<div className="ledger-page space-y-4 py-16 text-center">
					<h1 className="type-page">Day Not Found</h1>
					<p className="text-ink-2">
						The routine day associated with this session could not be found.
					</p>
					<button onClick={handleBack} className={BACK_BUTTON_CLASS}>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className={SHELL_CLASS}>
			{/* Header */}
			<SessionHeader
				routineName={routine!.name}
				dayName={`Day ${day.dayOfWeek}`}
				startedAt={session.startedAt}
				progressData={progressData}
				onNavigateBack={handleBack}
			/>

			{/* The rest bar is fixed, so it would sit on top of the last set and
			    the finish action. Reserve room for it only while it is shown. */}
			<div
				className={`ledger-page space-y-8 py-6 md:py-8 ${
					restTimer.remaining !== null ? 'pb-28' : ''
				}`}
			>
				{/* Action Card */}
				<SessionActionCard
					sessionId={session.id}
					routineName={routine!.name}
					dayName={`Day ${day.dayOfWeek}`}
					startedAt={session.startedAt}
					progressData={progressData}
					isFinishing={isFinishing}
					onFinishAttempt={() => handleFinishAttempt('COMPLETED')}
					onDiscardAttempt={() => handleFinishAttempt('ABORTED')}
					onNavigateBack={handleBack}
				/>

				{/* Exercise Groups */}
				{previousPerformanceError ? (
					<p
						className="type-label border-l-2 border-warning-strong bg-surface-sunk px-3 py-2 text-ink-2"
						role="status"
					>
						Previous performance is temporarily unavailable.
					</p>
				) : null}

				<div className="divide-y divide-rule-faint border-y border-rule">
					{groupedLogs.map(group => {
						const completedSets = group.sets.filter(
							set => set.isCompleted,
						).length
						const totalSets = group.sets.length

						return (
							<ExerciseGroup
								key={group.exerciseId}
								exerciseId={group.exerciseId}
								exerciseName={group.exerciseName}
								sets={group.sets}
								isCollapsed={isCollapsed(group.exerciseId)}
								onToggleCollapse={() => toggleExercise(group.exerciseId)}
								completedSets={completedSets}
								totalSets={totalSets}
								onSave={handleSaveSetLog}
								previousSets={previousSets}
								onSetCompleted={() => restTimer.start(group.restSeconds)}
								note={group.note}
								onSaveNote={note => {
									if (routineId) {
										updateNote({
											routineId,
											routineExerciseId: group.exerciseId,
											note,
										})
									}
								}}
							/>
						)
					})}
				</div>

				{/* Empty state */}
				{groupedLogs.length === 0 && (
					<div className="border-t border-rule py-16 text-center">
						<h3 className="type-section text-foreground">No Exercises Found</h3>
						<p className="mt-4 text-sm text-ink-2">
							This workout session doesn&apos;t have any exercises to log.
						</p>
					</div>
				)}
			</div>

			{/* Rest timer (LIVE-01). Fixed to the bottom, so it is rendered last
			    and outside the scrolling content. */}
			<RestTimerBar
				remaining={restTimer.remaining}
				total={restTimer.total}
				isOver={restTimer.isOver}
				onExtend={restTimer.extend}
				onDismiss={restTimer.dismiss}
			/>

			{/* Confirmation Dialog */}
			<SessionConfirmationDialog
				isOpen={isConfirmingFinish}
				onClose={cancelFinish}
				onConfirm={() => {
					if (finishStatus) executeFinish(finishStatus)
				}}
				progressData={progressData}
				routineName={routine!.name}
				isFinishing={isFinishing}
				status={finishStatus}
			/>
			<ProgressionResultDialog
				changes={progressionChanges}
				onContinue={completeProgressionReview}
			/>
		</div>
	)
}
