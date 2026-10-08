'use client'

import { routineDayLabel } from '@sunsteel/contracts'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { GlossaryLine } from '@/components/layout/glossary-line'
import { useToast } from '@/components/ui/toast'
import { ExerciseGroup } from '@/features/workout/exercise-group'
import {
	ExerciseSwapDialog,
	type SwapTarget,
} from '@/features/workout/exercise-swap-dialog'
import { RestTimerBar } from '@/features/workout/rest-timer-bar'
import { SessionActionCard } from '@/features/workout/session-action-card'
import { SessionConfirmationDialog } from '@/features/workout/session-confirmation-dialog'
import { SessionHeader } from '@/features/workout/session-header'
import { SessionLoadingSkeleton } from '@/features/workout/session-loading-skeleton'
import { WorkoutNoteButton } from '@/features/workout/session-notes'
import { SessionRecapDialog } from '@/features/workout/session-recap'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useCollapsibleExercises } from '@/hooks/use-collapsible-exercises'
import { useMotionPreference } from '@/hooks/use-motion-preference'
import { useRestTimer } from '@/hooks/use-rest-timer'
import { useScreenWakeLock } from '@/hooks/use-screen-wake-lock'
import { useSessionManagement } from '@/hooks/use-session-management'
import { exerciseLabel } from '@/i18n/catalog'
import { usePushSubscriptions } from '@/lib/api/hooks/usePushNotifications'
import { useRestAlert } from '@/lib/api/hooks/useRestAlert'
import {
	useDeleteSetLog,
	usePreviousPerformance,
	useSession,
	useUpsertSetLog,
} from '@/lib/api/hooks/useWorkoutSession'
import type { SetLog } from '@/lib/api/types/workout.type'
import { AUTO_COLLAPSE_DELAY_MS } from '@/lib/constants/session.constants'
import {
	isRotationDay,
	sessionLinearBlock,
} from '@/lib/utils/session-linear-block'
import { noteFor } from '@/lib/utils/session-notes'
import {
	sessionPrescription,
	sessionRoutineTitle,
} from '@/lib/utils/session-prescription'
import {
	completesExercise,
	groupSetLogsByExercise,
	isExerciseDone,
} from '@/lib/utils/session-progress.utils'
import {
	describeRound,
	describeUpNext,
	nextSetAfter,
	type RoundSlot,
	roundStatus,
} from '@/lib/utils/session-rounds'
import {
	applySessionSubstitutions,
	substitutionFor,
} from '@/lib/utils/session-substitutions'
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

/**
 * WCAG 2.4.11 (v1.1): a field or exercise brought into view -- by Tab, or by
 * the round's scroll to the next exercise -- lands clear of the pinned
 * masthead above it and the rest bar below it, instead of under them.
 */
const SCROLL_CLEAR_CLASS =
	'[&_input]:scroll-mt-52 [&_section]:scroll-mt-52 [&_input]:scroll-mb-28 lg:[&_input]:scroll-mt-32 lg:[&_section]:scroll-mt-32'

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
	const errorText = useApiErrorMessage()
	const t = useTranslations('workout.sessionPage')
	const tRounds = useTranslations('workout.rounds')
	const tPrescription = useTranslations('workout.prescription')
	const tEx = useTranslations('catalog.exercises')
	const params = useParams<{ id: string | string[] }>()
	const router = useRouter()
	const idParam = Array.isArray(params.id) ? params.id[0] : params.id

	// Data fetching
	const { data: session, isLoading, error } = useSession(idParam)
	const { data: previousPerformance, error: previousPerformanceError } =
		usePreviousPerformance(idParam)
	const { mutate: upsertSetLog } = useUpsertSetLog(idParam)
	const { mutate: deleteSetLog } = useDeleteSetLog(idParam)
	const { push } = useToast()
	const routineId = session?.routineId ?? ''
	// ROUT-15/LIVE-11: the session trains its own snapshot day, which is also
	// the only place a training block's day can be read from.
	const day = useMemo(
		() => sessionPrescription(session),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[session?.routineDay],
	)

	// LIVE-02: hold the screen awake only while the session is genuinely in
	// progress. Gating on the status rather than the route means finishing or
	// aborting drops the lock immediately, without waiting for the redirect.
	useScreenWakeLock(session?.status === 'IN_PROGRESS')

	// LIVE-01: rest runs off the exercise's own restSeconds, started by the
	// tap that ticks a set complete.
	const restTimer = useRestTimer()

	// NOTIF-03: the same deadline, sent to the server so the OS can ring when
	// the screen is locked and LIVE-01's WebAudio tone cannot. Only attempted
	// for accounts that actually have a subscribed device, so an account that
	// never enabled notifications makes no extra request per set.
	const { data: pushSubscriptions } = usePushSubscriptions()
	const restAlert = useRestAlert(
		idParam,
		(pushSubscriptions?.subscriptions.length ?? 0) > 0,
	)
	const restingExerciseRef = useRef<string>(t('nextSetFallback'))
	useEffect(() => {
		if (restTimer.deadline === null) {
			restAlert.cancel()
			return
		}
		restAlert.schedule(restTimer.deadline, restingExerciseRef.current)
	}, [restAlert, restTimer.deadline])

	// Session management
	const {
		isConfirmingFinish,
		progressData,
		handleFinishAttempt,
		executeFinish,
		cancelFinish,
		isFinishing,
		finishStatus,
		recap,
		completeRecap,
	} = useSessionManagement({
		sessionId: idParam,
		day,
		setLogs: session?.setLogs,
	})

	// Collapsible exercises state
	const { toggleExercise, isCollapsed, collapseExercise, expandExercise } =
		useCollapsibleExercises()

	// LIVE-14: the set last ticked, which decides where the rounds go next.
	const [lastCompleted, setLastCompleted] = useState<{
		exerciseId: string
		setNumber: number
	} | null>(null)

	// LIVE-11: the slot whose exercise is being swapped, if any.
	const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null)

	// Handlers
	const handleSaveSetLog = useCallback(
		(payload: UpsertSetLogPayload) => {
			upsertSetLog(payload)
		},
		[upsertSetLog],
	)

	// LIVE-15: only the last added set of an exercise can be taken back.
	const handleRemoveSet = useCallback(
		(routineExerciseId: string, setNumber: number) => {
			deleteSetLog(
				{ routineExerciseId, setNumber },
				{
					onError: error =>
						push({
							title: t('couldNotRemoveSetTitle'),
							description:
								error instanceof Error ? errorText(error) : t('tryAgain'),
							variant: 'destructive',
						}),
				},
			)
		},
		[deleteSetLog, errorText, push, t],
	)

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	// Group set logs by exercise for display
	const groupedLogs = useMemo<GroupedExerciseLogs[]>(() => {
		if (!session?.setLogs || !day) return [] as GroupedExerciseLogs[]

		// A swapped slot is shown and logged as the exercise actually performed.
		return groupSetLogsByExercise(
			session.setLogs as SetLog[],
			applySessionSubstitutions(day.exercises, session.exerciseSubstitutions),
			session.id,
		)
	}, [session?.setLogs, session?.id, session?.exerciseSubstitutions, day])
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

	// LIVE-14: the day's exercises as rounds see them -- grouped by the links
	// the session's snapshot recorded (ROUT-12), in the order they are shown.
	const roundSlots = useMemo<RoundSlot[]>(
		() =>
			groupedLogs.map(group => ({
				exerciseId: group.exerciseId,
				exerciseName: group.exerciseName,
				linkedToNext: Boolean(
					day?.exercises.find(exercise => exercise.id === group.exerciseId)
						?.linkedToNext,
				),
				sets: group.sets,
			})),
		[day, groupedLogs],
	)
	const upNext = useMemo(
		() => nextSetAfter(roundSlots, lastCompleted),
		[roundSlots, lastCompleted],
	)

	// LIVE-21: an exercise its last tick finished folds a moment later, and a
	// round handing over glides to the next exercise and tints it on arrival.
	const { reduced: reducedMotion } = useMotionPreference()
	const reducedMotionRef = useRef(reducedMotion)
	const groupedLogsRef = useRef(groupedLogs)
	useEffect(() => {
		reducedMotionRef.current = reducedMotion
		groupedLogsRef.current = groupedLogs
	}, [reducedMotion, groupedLogs])
	const [arrival, setArrival] = useState<string | null>(null)
	const [scrollRequest, setScrollRequest] = useState<{
		exerciseId: string
		block: ScrollLogicalPosition
	} | null>(null)
	// Runs after the commit that opened or folded the exercises, so the target
	// is already where it will stay when the scroll starts.
	useEffect(() => {
		if (!scrollRequest) return
		document
			.getElementById(`exercise-${scrollRequest.exerciseId}`)
			?.scrollIntoView({
				behavior: reducedMotionRef.current ? 'auto' : 'smooth',
				block: scrollRequest.block,
			})
	}, [scrollRequest])
	const foldTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
	useEffect(() => {
		const timers = foldTimers.current
		return () => timers.forEach(clearTimeout)
	}, [])
	const handOff = useCallback(
		(exerciseId: string) => {
			expandExercise(exerciseId)
			setArrival(exerciseId)
			setScrollRequest({ exerciseId, block: 'start' })
		},
		[expandExercise],
	)
	const foldWhenDone = useCallback(
		(exerciseId: string, then: string | null) => {
			clearTimeout(foldTimers.current.get(exerciseId))
			foldTimers.current.set(
				exerciseId,
				setTimeout(() => {
					foldTimers.current.delete(exerciseId)
					// A set unticked meanwhile keeps the exercise open.
					const latest = groupedLogsRef.current.find(
						group => group.exerciseId === exerciseId,
					)
					if (!latest || !isExerciseDone(latest.sets)) return
					// The tick is about to unmount -- and saving disables it, which
					// already dropped focus to the body: hand focus to the
					// exercise's own toggle, unless the member has moved on.
					const section = document.getElementById(`exercise-${exerciseId}`)
					const active = document.activeElement
					if (active === document.body || section?.contains(active))
						document
							.getElementById(`exercise-${exerciseId}-toggle`)
							?.focus({ preventScroll: true })
					collapseExercise(exerciseId)
					if (then) handOff(then)
					else setScrollRequest({ exerciseId, block: 'nearest' })
				}, AUTO_COLLAPSE_DELAY_MS),
			)
		},
		[collapseExercise, handOff],
	)

	if (isLoading) {
		return <SessionLoadingSkeleton />
	}

	// Error state
	if (error) {
		return (
			<div className={SHELL_CLASS}>
				<div className="ledger-page space-y-4 py-16 text-center">
					<h1 className="type-page text-destructive">{t('errorTitle')}</h1>
					<p className="text-ink-2">
						{errorText(error) || t('failedToLoadSession')}
					</p>
					<button onClick={handleBack} className={BACK_BUTTON_CLASS}>
						{t('goBack')}
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
					<h1 className="type-page">{t('sessionNotFoundTitle')}</h1>
					<p className="text-ink-2">{t('sessionNotFoundBody')}</p>
					<button onClick={handleBack} className={BACK_BUTTON_CLASS}>
						{t('goBack')}
					</button>
				</div>
			</div>
		)
	}

	if (!day) {
		return (
			<div className={SHELL_CLASS}>
				<div className="ledger-page space-y-4 py-16 text-center">
					<h1 className="type-page">{t('dayNotFoundTitle')}</h1>
					<p className="text-ink-2">{t('dayNotFoundBody')}</p>
					<button onClick={handleBack} className={BACK_BUTTON_CLASS}>
						{t('goBack')}
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className={SHELL_CLASS}>
			{/* Header */}
			<SessionHeader
				routineName={sessionRoutineTitle(session, tPrescription)}
				dayName={routineDayLabel(day)}
				startedAt={session.startedAt}
				progressData={progressData}
				onNavigateBack={handleBack}
			/>

			{/* The rest bar is fixed, so it would sit on top of the last set and
			    the finish action. Reserve room for it only while it is shown. */}
			<div
				// v1.1 §26.4: a phone reaches the first set sooner; the regions keep
				// their order and their rules.
				className={`ledger-page space-y-6 py-4 md:space-y-8 md:py-8 ${SCROLL_CLEAR_CLASS} ${
					restTimer.remaining !== null ? 'pb-28' : ''
				}`}
			>
				{/* Action Card */}
				<SessionActionCard
					sessionId={session.id}
					routineName={sessionRoutineTitle(session, tPrescription)}
					dayName={routineDayLabel(day)}
					startedAt={session.startedAt}
					progressData={progressData}
					isFinishing={isFinishing}
					onFinishAttempt={() => handleFinishAttempt('COMPLETED')}
					onDiscardAttempt={() => handleFinishAttempt('ABORTED')}
					onNavigateBack={handleBack}
				/>

				{/* UX-18: the terms the set rows use, defined one tap away. */}
				<GlossaryLine terms={['rpe', 'rir', 'setKinds']} />

				{/* Exercise Groups */}
				{previousPerformanceError ? (
					<p
						className="type-label border-l-2 border-warning-strong bg-surface-sunk px-3 py-2 text-ink-2"
						role="status"
					>
						{t('previousPerformanceUnavailable')}
					</p>
				) : null}

				{/* Rows rule themselves with `.rule-row` (§11.5). A `divide-*` colour
				    here repainted every row's `.mark` edge but the last's (TD-42). */}
				{/* v1.1 §26.5 / §10.2: from `md` the exercises are one column at a
				    reading width -- header, sets and rules aligned -- instead of
				    three numbers floating in 300px columns at 1440. */}
				<div className="border-y border-rule md:max-w-3xl">
					{groupedLogs.map((group, groupIndex) => {
						const status = roundStatus(roundSlots, groupIndex)
						const completedSets = group.sets.filter(
							set => set.isCompleted,
						).length
						const totalSets = group.sets.length
						const slot = day.exercises.find(
							exercise => exercise.id === group.exerciseId,
						)
						const prescribed = slot?.exercise
						const substitution = substitutionFor(
							session.exerciseSubstitutions,
							group.exerciseId,
						)

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
								roundLine={
									status
										? `${status.label} · ${describeRound(status, tRounds)}`
										: null
								}
								upNext={
									status && upNext?.exerciseId === group.exerciseId
										? describeUpNext(upNext, tRounds)
										: null
								}
								onSetCompleted={setNumber => {
									// LIVE-14: in a superset or circuit the next set is the
									// partner's; the rest is this exercise's own (0:00 when it
									// hands straight over), and the alert names what follows.
									const just = { exerciseId: group.exerciseId, setNumber }
									const next = nextSetAfter(roundSlots, just)
									setLastCompleted(just)
									restingExerciseRef.current = exerciseLabel(
										next?.exerciseName ?? group.exerciseName,
										tEx,
									)
									restTimer.start(group.restSeconds)
									const handsOverTo =
										status && next && next.exerciseId !== group.exerciseId
											? next.exerciseId
											: null
									// LIVE-21: a finished exercise folds first and the
									// hand-off follows, so the fold never moves the
									// scroll's target mid-way.
									if (completesExercise(group.sets, setNumber))
										foldWhenDone(group.exerciseId, handsOverTo)
									else if (handsOverTo) handOff(handsOverTo)
								}}
								arriving={arrival === group.exerciseId}
								onArrivalEnd={() => setArrival(null)}
								substitutedFrom={
									substitution && prescribed ? prescribed.name : null
								}
								onSwapRequest={
									session.status === 'IN_PROGRESS' && prescribed
										? () =>
												setSwapTarget({
													routineExerciseId: group.exerciseId,
													performed: {
														id: substitution?.exercise.id ?? prescribed.id,
														name: group.exerciseName,
													},
													prescribed: {
														id: prescribed.id,
														name: prescribed.name,
													},
													hasCompletedSets: completedSets > 0,
													// ROUT-17: a block's slot can be swapped
													// for this workout only.
													linearBlock: Boolean(
														sessionLinearBlock(
															slot ?? { progressionScheme: '' },
														).state,
													),
												})
										: undefined
								}
								onRemoveSet={
									session.status === 'IN_PROGRESS' ? handleRemoveSet : undefined
								}
								linearBlock={
									group.linearPeriodization
										? {
												state: group.linearPeriodization,
												rotation: isRotationDay(session.routineDay),
												routineId: routineId || undefined,
											}
										: null
								}
								linearBlockUnset={group.linearBlockUnset}
								sessionId={session.id}
								instruction={group.note}
								sessionNote={noteFor(session.exerciseNotes, group.exerciseId)}
							/>
						)
					})}
				</div>

				{/* LIVE-16: the note about the whole workout, written as it happens. */}
				<section aria-labelledby="workout-note-heading" className="space-y-3">
					<h2
						id="workout-note-heading"
						className="type-section rule-heading pb-2 text-foreground"
					>
						{t('workoutNoteHeading')}
					</h2>
					<p className="type-body-sm max-w-[68ch] whitespace-pre-line text-ink-2">
						{session.notes?.trim() || t('noNoteYet')}
					</p>
					<WorkoutNoteButton
						sessionId={session.id}
						note={session.notes ?? null}
					/>
				</section>

				{/* Empty state */}
				{groupedLogs.length === 0 && (
					<div className="border-t border-rule py-16 text-center">
						<h3 className="type-section text-foreground">
							{t('noExercisesTitle')}
						</h3>
						<p className="mt-4 text-sm text-ink-2">{t('noExercisesBody')}</p>
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
				routineName={sessionRoutineTitle(session, tPrescription)}
				isFinishing={isFinishing}
				status={finishStatus}
			/>
			<ExerciseSwapDialog
				sessionId={session.id}
				routineId={routineId || undefined}
				trainingBlockName={session.trainingBlock?.name}
				deload={!!session.temporaryOverride}
				target={swapTarget}
				otherExerciseIds={groupedLogs
					.filter(group => group.exerciseId !== swapTarget?.routineExerciseId)
					.flatMap(group => (group.sets[0] ? [group.sets[0].exerciseId] : []))}
				onClose={() => setSwapTarget(null)}
			/>
			<SessionRecapDialog
				recap={recap}
				onContinue={completeRecap}
				rotation={isRotationDay(session.routineDay)}
			/>
		</div>
	)
}
