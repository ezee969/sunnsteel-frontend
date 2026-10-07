'use client'

import { useSearchParams } from 'next/navigation'

import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { sendableRoutines } from '@/lib/utils/messages'

import type { AttachedRoutine } from './message-composer'

/**
 * MSG-07: the routine "Send in a message" handed to the composer through
 * `?routine=`, once it is found among the member's own sendable routines.
 * An id that is not one of theirs attaches nothing; the server would refuse
 * it anyway.
 */
export function useAttachedRoutine(): AttachedRoutine | null {
	const routineId = useSearchParams().get('routine')
	const routines = useRoutines()
	if (!routineId) return null
	const routine = sendableRoutines(routines.data ?? []).find(
		candidate => candidate.id === routineId,
	)
	return routine ? { id: routine.id, name: routine.name } : null
}
