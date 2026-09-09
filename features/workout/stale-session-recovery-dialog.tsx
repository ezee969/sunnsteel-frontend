'use client'

import { formatDistanceToNowStrict } from 'date-fns'
import { AlertTriangle, CheckCircle2, Play, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
								? 'Saved workout completed'
								: 'Workout discarded',
						description:
							status === 'COMPLETED'
								? 'Your completed sets were kept in your history.'
								: 'The abandoned session will no longer block a new workout.',
					})
					router.replace('/dashboard')
				},
				onError: error => {
					push({
						title: 'Could not resolve workout',
						description:
							error instanceof Error
								? error.message
								: 'Please check your connection and try again.',
					})
				},
			},
		)
	}

	if (!recovery || !session) return null

	const routineName = session.routine?.name ?? 'your workout'
	const lastActivity = formatDistanceToNowStrict(
		new Date(recovery.lastActivityAt),
		{ addSuffix: true },
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
						Recover your workout
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-3 text-left">
							<p>
								<span className="font-medium text-foreground">
									{routineName}
								</span>{' '}
								has not had saved activity since {lastActivity}. Choose what to
								do before starting another workout.
							</p>
							<div className="type-body-sm bg-surface-sunk p-3">
								{hasDetailedSetLogs ? (
									<span className="font-medium text-foreground">
										{recovery.completedSets} of {recovery.totalSets} sets saved
									</span>
								) : (
									<span className="font-medium text-foreground">
										{isFetchingDetails
											? 'Checking saved sets…'
											: 'Saved set count unavailable'}
									</span>
								)}
								{hasDetailedSetLogs && !hasSavedWork && (
									<p className="mt-1">
										There are no completed sets to add to workout history.
									</p>
								)}
								{hasDetailsError && (
									<p className="mt-1">
										Finishing will still keep any completed sets stored on the
										server.
									</p>
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
						<Trash2 className="h-4 w-4" />
						Discard
					</Button>
					<Button
						variant="outline"
						onClick={() => resolveSession('COMPLETED')}
						disabled={isPending || !canFinishSavedWork}
					>
						<CheckCircle2 className="h-4 w-4" />
						Finish saved work
					</Button>
					<Button variant="default" onClick={handleResume} disabled={isPending}>
						<Play className="h-4 w-4" />
						{resumeSession.isPending ? 'Resuming…' : 'Resume'}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
