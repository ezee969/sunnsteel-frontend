'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import {
	useProgressTimeline,
	useSessionRecap,
} from '@/lib/api/hooks/useWorkoutSession'
import {
	ATTACH_EXERCISE_PARAM,
	ATTACH_PARAMS,
	type AttachRef,
	sendableRoutines,
	workoutName,
} from '@/lib/utils/messages'
import { getRecordTimelinePerformanceLabel } from '@/lib/utils/progress-timeline'

import type { AttachedObject } from './message-composer'

/**
 * MSG-07/MSG-10/MSG-11: the object "Send in a message" handed to the
 * composer through `?routine=`, `?workout=` or `?record=&exercise=`, as it
 * was handed in.
 */
export function useAttachRef(): AttachRef | null {
	const params = useSearchParams()
	const routineId = params.get(ATTACH_PARAMS.ROUTINE)
	if (routineId) return { kind: 'ROUTINE', id: routineId }
	const sessionId = params.get(ATTACH_PARAMS.WORKOUT)
	if (sessionId) return { kind: 'WORKOUT', id: sessionId }
	const eventId = params.get(ATTACH_PARAMS.RECORD)
	const exerciseId = params.get(ATTACH_EXERCISE_PARAM)
	return eventId && exerciseId
		? { kind: 'RECORD', id: eventId, exerciseId }
		: null
}

/**
 * That object with its name, once it is found among the member's own: a
 * sendable routine, a finished workout through its recap, or a record among
 * that lift's on the progress timeline. An id that is not theirs attaches
 * nothing; the server would refuse it anyway.
 */
export function useAttachedObject(): AttachedObject | null {
	const ref = useAttachRef()
	const routines = useRoutines()
	const recap = useSessionRecap(
		ref?.kind === 'WORKOUT' ? ref.id : '',
		ref?.kind === 'WORKOUT',
	)
	const tEx = useTranslations('catalog.exercises')
	const locale = useLocale() as Locale
	const unit = useWeightUnit()
	const lift = useProgressTimeline('PERSONAL_RECORD', {
		exerciseId: ref?.kind === 'RECORD' ? ref.exerciseId : undefined,
		limit: 50,
		enabled: ref?.kind === 'RECORD',
	})
	if (!ref) return null
	if (ref.kind === 'RECORD') {
		const record = (lift.data?.pages ?? [])
			.flatMap(page => page.items)
			.find(item => item.eventId === ref.id)
		return record && record.type === 'PERSONAL_RECORD'
			? {
					kind: 'RECORD',
					id: record.eventId,
					exerciseId: record.exerciseId,
					name: `${exerciseLabel(record.exerciseName, tEx)} · ${getRecordTimelinePerformanceLabel(record, unit, locale)}`,
				}
			: null
	}
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
