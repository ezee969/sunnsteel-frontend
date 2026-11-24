'use client'

import { BodyProgressSection } from '@/features/progress/body-progress'
import { ProgressTab } from '@/features/progress/progress-tab'
import { useLengthUnit } from '@/hooks/use-length-unit'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { usePersonalGoals } from '@/lib/api/hooks/useWorkoutSession'

/**
 * Progress › Body (UX-11): body weight and measurements. The goals read is
 * Overview's own key, so the body-weight goal's line costs no extra request
 * when the member came from there.
 */
export default function ProgressBodyPage() {
	const weightUnit = useWeightUnit()
	const lengthUnit = useLengthUnit()
	const personalGoals = usePersonalGoals()

	return (
		<ProgressTab>
			<BodyProgressSection
				weightUnit={weightUnit}
				lengthUnit={lengthUnit}
				goals={personalGoals.data?.goals}
			/>
		</ProgressTab>
	)
}
