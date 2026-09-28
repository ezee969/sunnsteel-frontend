'use client'

import { MeasurableGoalsSettingsCard } from '@/features/settings/measurable-goals-settings-card'
import { SettingsTab } from '@/features/settings/settings-tab'
import { TrainingLocationPreferencesCard } from '@/features/settings/training-location-preferences-card'
import { useWeightUnit } from '@/hooks/use-weight-unit'

/**
 * Settings › Training (UX-12): where you train, with its equipment and
 * plates, and your measurable goals, both in the account's saved unit.
 */
export default function SettingsTrainingPage() {
	const weightUnit = useWeightUnit()
	return (
		<SettingsTab>
			<TrainingLocationPreferencesCard weightUnit={weightUnit} />
			<MeasurableGoalsSettingsCard weightUnit={weightUnit} />
		</SettingsTab>
	)
}
