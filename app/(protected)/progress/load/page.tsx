'use client'

import { MuscleGroupHeatmap } from '@/features/progress/muscle-group-heatmap'
import { useProgressControls } from '@/features/progress/progress-controls'
import { ProgressTab } from '@/features/progress/progress-tab'
import { VolumeTrends } from '@/features/progress/volume-trends'
import {
	useMuscleGroupHeatmap,
	useVolumeTrend,
} from '@/lib/api/hooks/useWorkoutSession'

/** Progress › Load (UX-11): how the work is spread across muscles and weeks. */
export default function ProgressLoadPage() {
	const { heatmapWeeks, setHeatmapWeeks, volumeWeeks, setVolumeWeeks } =
		useProgressControls()
	const muscleHeatmap = useMuscleGroupHeatmap(heatmapWeeks)
	const volumeTrend = useVolumeTrend(volumeWeeks)

	return (
		<ProgressTab>
			<MuscleGroupHeatmap
				data={muscleHeatmap.data}
				weeks={heatmapWeeks}
				isPending={muscleHeatmap.isPending}
				isError={Boolean(muscleHeatmap.error)}
				onWeeksChange={setHeatmapWeeks}
				onRetry={() => void muscleHeatmap.retry()}
			/>

			<VolumeTrends
				data={volumeTrend.data}
				weeks={volumeWeeks}
				isPending={volumeTrend.isPending}
				isError={Boolean(volumeTrend.error)}
				onWeeksChange={setVolumeWeeks}
				onRetry={() => void volumeTrend.retry()}
			/>
		</ProgressTab>
	)
}
