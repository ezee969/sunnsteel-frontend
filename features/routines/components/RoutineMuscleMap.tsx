'use client'

import type { RoutineScheduleMode, SetKind } from '@sunsteel/contracts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { CollapsibleSection } from '@/components/layout/collapsible-section'
import { InlineError } from '@/components/layout/inline-error'
import { LoadingRows } from '@/components/layout/loading-rows'
import { MuscleMap } from '@/features/body-map/body-map'
import { useExercises } from '@/lib/api/hooks/useExercises'
import { plannedMuscleSets, trainedMuscles } from '@/lib/utils/body-map'

interface RoutineMuscleMapProps {
	routineId: string
	/** The plan in force today (ROUT-15): a block's or deload's days if any. */
	plan: {
		days: ReadonlyArray<{
			exercises: ReadonlyArray<{
				exercise: { id: string }
				sets: ReadonlyArray<{ kind?: SetKind | null }>
			}>
		}>
		scheduleMode: RoutineScheduleMode
	}
}

/**
 * PROG-15: what the routine plans for each muscle over a week (a pass of a
 * rotation), on the same figure and scale as Progress, so the plan and a
 * trained week can be read side by side.
 */
export function RoutineMuscleMap({ routineId, plan }: RoutineMuscleMapProps) {
	const t = useTranslations('routines.detail')
	const tQuality = useTranslations('routines.quality')
	const { data: exercises, isPending, isError, refetch } = useExercises()
	const sets = useMemo(
		() =>
			plannedMuscleSets(
				plan.days.map(day => ({
					exercises: day.exercises.map(planned => ({
						exerciseId: planned.exercise.id,
						sets: planned.sets,
					})),
				})),
				Object.fromEntries(
					(exercises ?? []).map(exercise => [exercise.id, exercise]),
				),
			),
		[exercises, plan.days],
	)

	return (
		<CollapsibleSection
			id={`routine-muscles-${routineId}`}
			title={t('musclesTitle')}
			summary={
				exercises
					? t('musclesSummary', { count: trainedMuscles(sets).length })
					: undefined
			}
			description={
				plan.scheduleMode === 'ROTATION'
					? t('musclesRotation')
					: t('musclesWeekly')
			}
			defaultOpen
		>
			{isPending ? (
				<LoadingRows label={t('musclesLoading')} rows={3} />
			) : isError || !exercises ? (
				<InlineError
					title={t('musclesErrorTitle')}
					message={t('musclesErrorBody')}
					onRetry={() => void refetch()}
				/>
			) : (
				<MuscleMap
					sets={sets}
					emptyText={tQuality('noSetsPlanned')}
					untrainedText={muscles => tQuality('plannedUntrained', { muscles })}
				/>
			)}
		</CollapsibleSection>
	)
}
