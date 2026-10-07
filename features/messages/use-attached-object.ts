'use client'

import { useSearchParams } from 'next/navigation'

import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { useSessionRecap } from '@/lib/api/hooks/useWorkoutSession'
import {
	ATTACH_PARAMS,
	type AttachRef,
	sendableRoutines,
	workoutName,
} from '@/lib/utils/messages'

import type { AttachedObject } from './message-composer'

/**
 * MSG-07/MSG-10: the object "Send in a message" handed to the composer
 * through `?routine=` or `?workout=`, as it was handed in.
 */
export function useAttachRef(): AttachRef | null {
	const params = useSearchParams()
	const routineId = params.get(ATTACH_PARAMS.ROUTINE)
	if (routineId) return { kind: 'ROUTINE', id: routineId }
	const sessionId = params.get(ATTACH_PARAMS.WORKOUT)
	return sessionId ? { kind: 'WORKOUT', id: sessionId } : null
}

/**
 * That object with its name, once it is found among the member's own: a
 * sendable routine, or a finished workout through its recap. An id that is
 * not theirs attaches nothing; the server would refuse it anyway.
 */
export function useAttachedObject(): AttachedObject | null {
	const ref = useAttachRef()
	const routines = useRoutines()
	const recap = useSessionRecap(
		ref?.kind === 'WORKOUT' ? ref.id : '',
		ref?.kind === 'WORKOUT',
	)
	if (!ref) return null
	if (ref.kind === 'ROUTINE') {
		const routine = sendableRoutines(routines.data ?? []).find(
			candidate => candidate.id === ref.id,
		)
		return routine
			? { kind: 'ROUTINE', id: routine.id, name: routine.name }
			: null
	}
	return recap.data
		? { kind: 'WORKOUT', id: ref.id, name: workoutName(recap.data) }
		: null
}
