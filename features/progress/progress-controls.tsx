'use client'

import type { ProgressTimelineEventType } from '@sunsteel/contracts'
import { createContext, useContext, useMemo, useState } from 'react'

import type { MuscleHeatmapWeeks } from '@/lib/utils/muscle-heatmap'
import type { StrengthRange } from '@/lib/utils/strength-trend'
import type { VolumeTrendWeeks } from '@/lib/utils/volume-trend'

/**
 * UX-11: the choices a member makes on Progress's tabs -- the lift and date
 * range, the heatmap and volume windows, the compared routine day and the
 * timeline filter. They live in the Progress layout, which stays mounted
 * between tabs, so switching tab and back keeps them.
 */
interface ProgressControls {
	range: StrengthRange
	setRange: (range: StrengthRange) => void
	/** Fixed for the visit, so a range means the same dates on every tab. */
	rangeAnchor: Date
	exerciseId: string | undefined
	setExerciseId: (exerciseId: string | undefined) => void
	heatmapWeeks: MuscleHeatmapWeeks
	setHeatmapWeeks: (weeks: MuscleHeatmapWeeks) => void
	volumeWeeks: VolumeTrendWeeks
	setVolumeWeeks: (weeks: VolumeTrendWeeks) => void
	routineDayId: string | undefined
	setRoutineDayId: (routineDayId: string | undefined) => void
	timelineFilter: ProgressTimelineEventType | undefined
	setTimelineFilter: (filter: ProgressTimelineEventType | undefined) => void
}

const ProgressControlsContext = createContext<ProgressControls | null>(null)

export function ProgressControlsProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [range, setRange] = useState<StrengthRange>('90D')
	const [rangeAnchor] = useState(() => new Date())
	const [exerciseId, setExerciseId] = useState<string>()
	const [heatmapWeeks, setHeatmapWeeks] = useState<MuscleHeatmapWeeks>(8)
	const [volumeWeeks, setVolumeWeeks] = useState<VolumeTrendWeeks>(8)
	const [routineDayId, setRoutineDayId] = useState<string>()
	const [timelineFilter, setTimelineFilter] =
		useState<ProgressTimelineEventType>()

	const value = useMemo(
		() => ({
			range,
			setRange,
			rangeAnchor,
			exerciseId,
			setExerciseId,
			heatmapWeeks,
			setHeatmapWeeks,
			volumeWeeks,
			setVolumeWeeks,
			routineDayId,
			setRoutineDayId,
			timelineFilter,
			setTimelineFilter,
		}),
		[
			range,
			rangeAnchor,
			exerciseId,
			heatmapWeeks,
			volumeWeeks,
			routineDayId,
			timelineFilter,
		],
	)

	return (
		<ProgressControlsContext.Provider value={value}>
			{children}
		</ProgressControlsContext.Provider>
	)
}

export function useProgressControls(): ProgressControls {
	const controls = useContext(ProgressControlsContext)
	if (!controls) {
		throw new Error('useProgressControls needs ProgressControlsProvider')
	}
	return controls
}
