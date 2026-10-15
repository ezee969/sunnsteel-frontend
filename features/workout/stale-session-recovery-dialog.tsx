'use client'

import { formatDistanceToNowStrict } from 'date-fns'
import { AlertTriangle, CheckCircle2, Play, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { dateFnsLocale } from '@/i18n/date-locale'
import {
	useFinishSession,
	useSession,
	useStartSession,
} from '@/lib/api/hooks/useWorkoutSession'
import type { WorkoutSession } from '@/lib/api/types/workout.type'
import {
	getSessionRecoverySummary,
	STALE_SESSION_THRESHOLD_MS,
} from '@/lib/utils/session-recovery'
import {
	chosenEnd,
	describeEndTimeProblem,
	finishTimeline,
	toDateTimeLocal,
} from '@/lib/utils/workout-end-time'

import { WorkoutEndTimeField } from './workout-end-time-field'

interface StaleSessionRecoveryDialogProps {
	session: WorkoutSession | null | undefined
}

export function StaleSessionRecoveryDialog({
	session,
}: StaleSessionRecoveryDialogProps) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('workout.staleSessionRecovery')
	const tEnd = useTranslations('workout.endTime')
	const locale = useLocale() as Locale
	const router = useRouter()
	const { push } = useToast()
	const [nowMs, setNowMs] = useState(() => Date.now())
	const [dismissedActivity, setDismissedActivity] = useState<string | null>(
		null,
	)
	// LIVE-24: the end the saved work is finished with; it starts at the last
	// activity, since the workout was left long before now. Null until edited.
	const [endValue, setEndValue] = useState<string | null>(null)
	const [endProblem, setEndProblem] = useState<string | null>(null)
	const recoveryCandidate = getSessionRecoverySummary(session, nowMs)
	const {
		data: sessionDetails,
		isFetching: isFetchingDetails,
		isError: hasDetailsError,
	} = useSession(recoveryCandidate ? (session?.id ?? '') : '')
	const resumeSession = useStartSession()
	const finishSession = useFinishSession(session?.id ?? '')
	const sessionStatus = session?.status
	const sessionStartedAt = session?.startedAt
	const sessionLastActivityAt = session?.lastActivityAt

	useEffect(() => {
		if (sessionStatus !== 'IN_PROGRESS' || !sessionStartedAt) return
		const activityMs = Date.parse(sessionLastActivityAt ?? sessionStartedAt)
		if (!Number.isFinite(activityMs)) return

		const remainingMs = STALE_SESSION_THRESHOLD_MS - (Date.now() - activityMs)
		if (remainingMs <= 0) return

		const timer = setTimeout(() => setNowMs(Date.now()), remainingMs + 50)
		return () => clearTimeout(timer)
	}, [sessionLastActivityAt, sessionStartedAt, sessionStatus])

	const recovery = recoveryCandidate
		? getSessionRecoverySummary(sessionDetails ?? session, nowMs)
		: null
	const activityKey = recovery
		? `${session?.id}:${recovery.lastActivityAt}`
		: null
	const isPending = resumeSession.isPending || finishSession.isPending
	const isOpen = Boolean(recovery && activityKey !== dismissedActivity)

	const handleResume = () => {
		if (!session || !activityKey) return
		resumeSession.mutate(
			{
				routineId: session.routineId,
				routineDayId: session.routineDayId,
			},
			{
				onSuccess: () => {
					setDismissedActivity(activityKey)
					router.push(`/workouts/sessions/${session.id}`)
				},
			},
		)
	}

	const resolveSession = (status: 'COMPLETED' | 'ABORTED') => {
		if (!session) return
		let endedAt: string | undefined
		if (status === 'COMPLETED' && endTimeline) {
			const latest = new Date()
			const result = chosenEnd(
				endValue ?? toDateTimeLocal(endTimeline.lastActivity),
				endTimeline.earliest,
				latest,
			)
			if ('problem' in result) {
				setEndProblem(
					describeEndTimeProblem(
						result.problem,
						{ earliest: endTimeline.earliest, latest, finishing: true },
						locale,
						tEnd,
					),
				)
				return
			}
			endedAt = result.endedAt.toISOString()
		}
		finishSession.mutate(endedAt ? { status, endedAt } : { status }, {
			onSuccess: () => {
				push({
					title:
						status === 'COMPLETED'
							? t('savedWorkoutCompletedTitle')
							: t('workoutDiscardedTitle'),
					description:
						status === 'COMPLETED' ? t('keptInHistory') : t('noLongerBlock'),
				})
				router.replace(
					status === 'COMPLETED' && session?.id
						? `/workouts/history/${session.id}`
						: '/dashboard',
				)
			},
			onError: error => {
				push({
					title: t('couldNotResolveTitle'),
					description:
						error instanceof Error ? errorText(error) : t('checkConnection'),
				})
			},
		})
	}

	if (!recovery || !session) return null

	const routineName = session.routine?.name ?? t('yourWorkout')
	const lastActivity = formatDistanceToNowStrict(
		new Date(recovery.lastActivityAt),
		{ addSuffix: true, locale: dateFnsLocale(locale) },
	)
	const hasDetailedSetLogs = Boolean(sessionDetails)
	const hasSavedWork = recovery.completedSets > 0
	const canFinishSavedWork =
		hasDetailsError || (hasDetailedSetLogs && hasSavedWork)
	// Only with the sets read: the end cannot come before the last one.
	const endTimeline =
		sessionDetails && hasSavedWork
			? finishTimeline({
					startedAt: sessionDetails.startedAt,
					lastActivityAt: recovery.lastActivityAt,
					setLogs: sessionDetails.setLogs,
				})
			: null

	return (
		<AlertDialog open={isOpen}>
			<AlertDialogContent className="max-w-lg">
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2 text-foreground">
						<AlertTriangle
							className="h-5 w-5 text-warning-strong"
							aria-hidden
						/>
						{t('title')}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-3 text-left">
							<p>
								<span className="font-medium text-foreground">
									{routineName}
								</span>{' '}
								{t('hasNotHadActivity', { time: lastActivity })}
							</p>
							<div className="type-body-sm bg-surface-sunk p-3">
								{hasDetailedSetLogs ? (
									<span className="font-medium text-foreground">
										{t('setsSaved', {
											completed: recovery.completedSets,
											total: recovery.totalSets,
										})}
									</span>
								) : (
									<span className="font-medium text-foreground">
										{isFetchingDetails
											? t('checkingSets')
											: t('savedSetCountUnavailable')}
									</span>
								)}
								{hasDetailedSetLogs && !hasSavedWork && (
									<p className="mt-1">{t('noCompletedSets')}</p>
								)}
								{hasDetailsError && (
									<p className="mt-1">{t('detailsErrorNote')}</p>
								)}
							</div>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				{endTimeline && sessionDetails ? (
					<WorkoutEndTimeField
						id="recovery-end-time"
						label={tEnd('askLabel')}
						value={endValue ?? toDateTimeLocal(endTimeline.lastActivity)}
						onChange={value => {
							setEndValue(value)
							setEndProblem(null)
						}}
						earliest={endTimeline.earliest}
						latest={new Date(nowMs)}
						startedAt={sessionDetails.startedAt}
						lastSet={endTimeline.lastSet}
						problem={endProblem}
					/>
				) : null}
				<AlertDialogFooter>
					<Button
						variant="destructive"
						onClick={() => resolveSession('ABORTED')}
						disabled={isPending}
					>
						<Trash2 aria-hidden className="h-4 w-4" />
						{t('discard')}
					</Button>
					<Button
						variant="outline"
						onClick={() => resolveSession('COMPLETED')}
						disabled={isPending || !canFinishSavedWork}
					>
						<CheckCircle2 aria-hidden className="h-4 w-4" />
						{t('finishSavedWork')}
					</Button>
					<Button variant="default" onClick={handleResume} disabled={isPending}>
						<Play aria-hidden className="h-4 w-4" />
						{resumeSession.isPending ? t('resuming') : t('resume')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
