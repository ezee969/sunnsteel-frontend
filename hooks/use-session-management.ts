import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import { useToast } from '@/components/ui/toast'
import { useFinishSession } from '@/lib/api/hooks'
import type { Routine } from '@/lib/api/types/routine.type'
import type { SetLog } from '@/lib/api/types/workout.type'
import { SESSION_STATUS } from '@/lib/constants/session.constants'
import { logger } from '@/lib/utils/logger'
import {
	areAllSetsCompleted,
	calculateSessionProgress,
} from '@/lib/utils/session-progress.utils'
import { getSessionResolutionCopy } from '@/lib/utils/session-resolution'
import type {
	SessionProgressData,
	SessionStatus,
} from '@/lib/utils/workout-session.types'

interface UseSessionManagementProps {
	sessionId: string
	routine?: Routine
	routineDayId?: string
	setLogs?: SetLog[]
}

interface UseSessionManagementReturn {
	// State
	isConfirmingFinish: boolean
	finishStatus: SessionStatus | null

	// Progress data
	progressData: SessionProgressData

	// Actions
	handleFinishAttempt: (status: SessionStatus) => void
	executeFinish: (status: SessionStatus) => void
	cancelFinish: () => void

	// Status
	isFinishing: boolean
}

/**
 * Custom hook for managing workout session finishing logic and progress tracking
 */
export const useSessionManagement = ({
	sessionId,
	routine,
	routineDayId,
	setLogs,
}: UseSessionManagementProps): UseSessionManagementReturn => {
	const router = useRouter()
	const { push } = useToast()
	const { mutate: finishSession, isPending: isFinishing } =
		useFinishSession(sessionId)

	const [isConfirmingFinish, setIsConfirmingFinish] = useState(false)
	const [finishStatus, setFinishStatus] = useState<SessionStatus | null>(null)

	// Calculate progress data
	const progressData = (() => {
		if (!routine || !routineDayId || !setLogs) {
			return { totalSets: 0, completedSets: 0, percentage: 0 }
		}

		const day = routine.days.find(d => d.id === routineDayId)
		if (!day) {
			return { totalSets: 0, completedSets: 0, percentage: 0 }
		}

		return calculateSessionProgress(setLogs, day.exercises)
	})()

	/**
	 * Executes the session finish operation
	 */
	const executeFinish = useCallback(
		(status: SessionStatus) => {
			if (!status) return
			const copy = getSessionResolutionCopy(status)

			finishSession(
				{ status },
				{
					onSuccess: () => {
						if (status === SESSION_STATUS.ABORTED) {
							push({
								title: copy.successTitle,
								description: copy.successDescription,
							})
						}
						// Reset confirmation state on success and navigate away
						setIsConfirmingFinish(false)
						setFinishStatus(null)
						router.push('/dashboard')
					},
					onError: error => {
						logger.error('Failed to finish session:', error)
						push({
							title: copy.errorTitle,
							description:
								error instanceof Error
									? error.message
									: 'Please check your connection and try again.',
						})
						// Reset confirmation state on error
						setIsConfirmingFinish(false)
						setFinishStatus(null)
					},
				},
			)
		},
		[finishSession, push, router],
	)

	/**
	 * Handles the initial finish attempt, checking if confirmation is needed
	 */
	const handleFinishAttempt = useCallback(
		(status: SessionStatus) => {
			if (status === SESSION_STATUS.ABORTED) {
				setFinishStatus(SESSION_STATUS.ABORTED)
				setIsConfirmingFinish(true)
				return
			}

			if (!routine || !routineDayId || !setLogs) {
				setFinishStatus(status)
				setIsConfirmingFinish(true)
				return
			}

			const day = routine.days.find(d => d.id === routineDayId)

			const allSetsCompleted = day
				? areAllSetsCompleted(setLogs, day.exercises)
				: false

			if (allSetsCompleted) {
				executeFinish(status)
			} else {
				setFinishStatus(status)
				setIsConfirmingFinish(true)
			}
		},
		[routine, routineDayId, setLogs, executeFinish],
	)

	/**
	 * Cancels the finish confirmation dialog
	 */
	const cancelFinish = useCallback(() => {
		setIsConfirmingFinish(false)
		setFinishStatus(null)
	}, [])

	return {
		// State
		isConfirmingFinish,
		finishStatus,

		// Progress data
		progressData,

		// Actions
		handleFinishAttempt,
		executeFinish,
		cancelFinish,

		// Status
		isFinishing,
	}
}
