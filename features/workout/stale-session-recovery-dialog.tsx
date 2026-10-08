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

interface StaleSessionRecoveryDialogProps {
	session: WorkoutSession | null | undefined
}

export function StaleSessionRecoveryDialog({
	session,
}: StaleSessionRecoveryDialogProps) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('workout.staleSessionRecovery')
	const locale = useLocale()
	const router = useRouter()
	const { push } = useToast()
	const [nowMs, setNowMs] = useState(() => Date.now())
	const [dismissedActivity, setDismissedActivity] = useState<string | null>(
		null,
	)
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
		finishSession.mutate(
			{ status },
			{
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
			},
		)
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
