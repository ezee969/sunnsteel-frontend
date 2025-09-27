'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RoutineWizardData } from '../types'
import { extractRtfExercises, useFullRtfProgram, useRtfPreview, useTmTrendSnapshot } from '../utils/rtf-program.helpers'
import { isRtfScheme } from '../utils/rtf-program.helpers'

interface UseRtfProgramPreviewParams {
	readonly data: RoutineWizardData
	readonly onUpdate: (updates: Partial<RoutineWizardData>) => void
}

export const useRtfProgramPreview = ({
	data,
	onUpdate,
}: UseRtfProgramPreviewParams) => {
	const usesRtf = useMemo(
		() => data.days.some((day) => day.exercises.some((exercise) => isRtfScheme(exercise.progressionScheme))),
		[data.days],
	)

	useEffect(() => {
		if (!usesRtf) {
			return
		}

		const timezone = data.programTimezone?.trim()
		if (timezone) {
			return
		}

		const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
		if (browserTz) {
			onUpdate({ programTimezone: browserTz })
		}
	}, [data.programTimezone, onUpdate, usesRtf])

	useEffect(() => {
		if (!usesRtf) {
			return
		}

		if (!data.programStartWeek || data.programStartWeek < 1) {
			onUpdate({ programStartWeek: 1 })
		}
	}, [data.programStartWeek, onUpdate, usesRtf])

	const rtfExercises = useMemo(() => extractRtfExercises(data.days), [data.days])

	const [previewExerciseId, setPreviewExerciseId] = useState<string | undefined>(
		rtfExercises[0]?.exerciseId,
	)

	useEffect(() => {
		if (rtfExercises.length === 0) {
			setPreviewExerciseId(undefined)
			return
		}

		setPreviewExerciseId((prev) => {
			if (prev && rtfExercises.some((exercise) => exercise.exerciseId === prev)) {
				return prev
			}
			return rtfExercises[0]?.exerciseId
		})
	}, [rtfExercises])

	const selectedExercise = useMemo(
		() => rtfExercises.find((exercise) => exercise.exerciseId === previewExerciseId) ?? rtfExercises[0],
		[previewExerciseId, rtfExercises],
	)

	const preview = useRtfPreview(selectedExercise, data.programWithDeloads)
	const fullProgram = useFullRtfProgram(selectedExercise, data.programWithDeloads)
	const tmTrend = useTmTrendSnapshot(fullProgram, selectedExercise)

	return {
		usesRtf,
		rtfExercises,
		previewExerciseId,
		setPreviewExerciseId,
		selectedExercise,
		preview,
		fullProgram,
		tmTrend,
	}
}
