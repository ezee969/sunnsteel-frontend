'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { useWeightUnit } from '@/hooks/use-weight-unit'
import { achievementText, exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { useAchievements } from '@/lib/api/hooks/useAchievements'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import {
	useProgressTimeline,
	useSessionRecap,
} from '@/lib/api/hooks/useWorkoutSession'
import { formatComebackEvidence } from '@/lib/utils/achievements'
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
	// MSG-13: a comeback, by its recognition id.
	const comebackId = params.get(ATTACH_PARAMS.COMEBACK)
	if (comebackId) return { kind: 'COMEBACK', id: comebackId }
	// MSG-12: a milestone, by its catalog id.
	const achievementId = params.get(ATTACH_PARAMS.ACHIEVEMENT)
	if (achievementId) return { kind: 'ACHIEVEMENT', id: achievementId }
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
	const tCatalog = useTranslations('catalog.achievements')
	// Only for a milestone or a comeback handed in: the ledger's read takes the
	// account lock, and a conversation must not run it on every open.
	const achievements = useAchievements({
		enabled: ref?.kind === 'ACHIEVEMENT' || ref?.kind === 'COMEBACK',
	})
	const tComeback = useTranslations('achievements.comeback')
	if (!ref) return null
	if (ref.kind === 'COMEBACK') {
		const comeback = achievements.data?.comeback?.recognitions.find(
			candidate => candidate.id === ref.id,
		)
		return comeback
			? {
					kind: 'COMEBACK',
					id: comeback.id,
					name: formatComebackEvidence(comeback, tComeback),
				}
			: null
	}
	if (ref.kind === 'ACHIEVEMENT') {
		const achievement = achievements.data?.achievements.find(
			candidate => candidate.id === ref.id,
		)
		return achievement
			? {
					kind: 'ACHIEVEMENT',
					id: achievement.id,
					name: achievementText(achievement, tCatalog).title,
				}
			: null
	}
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
