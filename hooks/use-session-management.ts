import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { useFinishSession } from '@/lib/api/hooks'
import type { RoutineDay } from '@/lib/api/types/routine.type'
import type { SetLog, WorkoutSessionRecap } from '@/lib/api/types/workout.type'
import { SESSION_STATUS } from '@/lib/constants/session.constants'
import { logger } from '@/lib/utils/logger'
import {
	areAllSetsCompleted,
	calculateSessionProgress,
} from '@/lib/utils/session-progress.utils'
import { getSessionResolutionCopy } from '@/lib/utils/session-resolution'
import {
	chosenEnd,
	describeEndTimeProblem,
	type FinishTimeline,
	finishTimeline,
	toDateTimeLocal,
} from '@/lib/utils/workout-end-time'
import type {
	SessionProgressData,
	SessionStatus,
} from '@/lib/utils/workout-session.types'

interface UseSessionManagementProps {
	sessionId: string
	/** The prescription the session trains: its snapshot day (ROUT-15). */
	day?: RoutineDay | null
	setLogs?: SetLog[]
	/** LIVE-24: when the workout started and last saved anything. */
	startedAt?: string
	lastActivityAt?: string | null
}

/** LIVE-24: the end time asked for while the finish confirmation is open. */
export interface FinishEndTime {
	value: string
	setValue: (value: string) => void
	timeline: FinishTimeline
	/** Captured when the confirmation opened: the latest the end could be then. */
	openedAt: Date
	problem: string | null
}

interface UseSessionManagementReturn {
	// State
	isConfirmingFinish: boolean
	finishStatus: SessionStatus | null
	recap: WorkoutSessionRecap | null
	/** Null while nothing asks for it: a discard, or no start time known. */
	endTime: FinishEndTime | null

	// Progress data
	progressData: SessionProgressData

	// Actions
	handleFinishAttempt: (status: SessionStatus) => void
	executeFinish: (status: SessionStatus, endedAt?: string) => void
	/** Confirms the open finish; false keeps it open (the end time is wrong). */
	confirmFinish: () => boolean
	cancelFinish: () => void
	completeRecap: () => void

	// Status
	isFinishing: boolean
}

/**
 * Custom hook for managing workout session finishing logic and progress tracking
 */
export const useSessionManagement = ({
	sessionId,
	day,
	setLogs,
	startedAt,
	lastActivityAt,
}: UseSessionManagementProps): UseSessionManagementReturn => {
	const errorText = useApiErrorMessage()
	const router = useRouter()
	const { push } = useToast()
	const t = useTranslations('workout.sessionResolution')
	const tEnd = useTranslations('workout.endTime')
	const locale = useLocale() as Locale
	const { mutate: finishSession, isPending: isFinishing } =
		useFinishSession(sessionId)

	const [isConfirmingFinish, setIsConfirmingFinish] = useState(false)
	const [finishStatus, setFinishStatus] = useState<SessionStatus | null>(null)
	const [recap, setRecap] = useState<WorkoutSessionRecap | null>(null)
	// LIVE-24: the end time being chosen, and whether "now" is left untouched.
	const [endDraft, setEndDraft] = useState<{
		value: string
		initial: string
		initialIsNow: boolean
		timeline: FinishTimeline
		openedAt: Date
		problem: string | null
	} | null>(null)

	// Calculate progress data
	const progressData = (() => {
		if (!day || !setLogs) {
			return { totalSets: 0, completedSets: 0, percentage: 0 }
		}

		return calculateSessionProgress(setLogs, day.exercises)
	})()

	/**
	 * Executes the session finish operation
	 */
	const executeFinish = useCallback(
		(status: SessionStatus, endedAt?: string) => {
			if (!status) return
			const copy = getSessionResolutionCopy(status, t)

			finishSession(endedAt ? { status, endedAt } : { status }, {
				onSuccess: result => {
					if (status === SESSION_STATUS.ABORTED) {
						push({
							title: copy.successTitle,
							description: copy.successDescription,
						})
					}
					// Reset confirmation state on success. A completed session with
					// a recap stays on this route until the owner has reviewed it.
					setIsConfirmingFinish(false)
					setFinishStatus(null)
					setEndDraft(null)
					if (status === SESSION_STATUS.COMPLETED && result.recap) {
						setRecap(result.recap)
						return
					}
					router.push('/dashboard')
				},
				onError: error => {
					logger.error('Failed to finish session:', error)
					push({
						title: copy.errorTitle,
						description:
							error instanceof Error ? errorText(error) : t('checkConnection'),
					})
					// Reset confirmation state on error
					setIsConfirmingFinish(false)
					setFinishStatus(null)
				},
			})
		},
		[errorText, finishSession, push, router, t],
	)

	/**
	 * Handles the initial finish attempt, checking if confirmation is needed
	 */
	const handleFinishAttempt = useCallback(
		(status: SessionStatus) => {
			setEndDraft(null)
			if (status === SESSION_STATUS.ABORTED) {
				setFinishStatus(SESSION_STATUS.ABORTED)
				setIsConfirmingFinish(true)
				return
			}

			// LIVE-24: finishing long after the last set asks when it ended,
			// starting from that set; otherwise the field starts at now.
			const now = new Date()
			const timeline = startedAt
				? finishTimeline({ startedAt, lastActivityAt, setLogs }, now)
				: null
			if (timeline) {
				const initial = toDateTimeLocal(
					timeline.asks ? timeline.lastActivity : now,
				)
				setEndDraft({
					value: initial,
					initial,
					initialIsNow: !timeline.asks,
					timeline,
					openedAt: now,
					problem: null,
				})
			}

			const allSetsCompleted =
				!!day && !!setLogs && areAllSetsCompleted(setLogs, day.exercises)

			if (allSetsCompleted && !timeline?.asks) {
				executeFinish(status)
			} else {
				setFinishStatus(status)
				setIsConfirmingFinish(true)
			}
		},
		[day, setLogs, startedAt, lastActivityAt, executeFinish],
	)

	const confirmFinish = useCallback((): boolean => {
		if (!finishStatus) return true
		if (finishStatus === SESSION_STATUS.ABORTED || !endDraft) {
			executeFinish(finishStatus)
			return true
		}
		// An untouched "now" is left to the server, so the end is the moment
		// of the press rather than of opening the confirmation.
		if (endDraft.initialIsNow && endDraft.value === endDraft.initial) {
			executeFinish(finishStatus)
			return true
		}
		const latest = new Date()
		const result = chosenEnd(endDraft.value, endDraft.timeline.earliest, latest)
		if ('problem' in result) {
			setEndDraft({
				...endDraft,
				problem: describeEndTimeProblem(
					result.problem,
					{ earliest: endDraft.timeline.earliest, latest, finishing: true },
					locale,
					tEnd,
				),
			})
			return false
		}
		executeFinish(finishStatus, result.endedAt.toISOString())
		return true
	}, [endDraft, executeFinish, finishStatus, locale, tEnd])

	/**
	 * Cancels the finish confirmation dialog
	 */
	const cancelFinish = useCallback(() => {
		setIsConfirmingFinish(false)
		setFinishStatus(null)
		setEndDraft(null)
	}, [])

	const endTime: FinishEndTime | null =
		endDraft && finishStatus === SESSION_STATUS.COMPLETED
			? {
					value: endDraft.value,
					setValue: value =>
						setEndDraft(current =>
							current ? { ...current, value, problem: null } : current,
						),
					timeline: endDraft.timeline,
					openedAt: endDraft.openedAt,
					problem: endDraft.problem,
				}
			: null

	const completeRecap = useCallback(() => {
		setRecap(null)
		router.push('/dashboard')
	}, [router])

	return {
		// State
		isConfirmingFinish,
		finishStatus,
		recap,
		endTime,

		// Progress data
		progressData,

		// Actions
		handleFinishAttempt,
		executeFinish,
		confirmFinish,
		cancelFinish,
		completeRecap,

		// Status
		isFinishing,
	}
}
