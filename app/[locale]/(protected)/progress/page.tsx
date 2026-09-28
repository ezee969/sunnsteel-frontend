'use client'

import { PersonalGoals } from '@/features/progress/personal-goals'
import { PlateauWatch } from '@/features/progress/plateau-watch'
import { ProgressTab } from '@/features/progress/progress-tab'
import { TrainingSignals } from '@/features/progress/training-signals'
import { useHashForward } from '@/hooks/use-hash-forward'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	useDeloadSuggestion,
	usePersonalGoals,
	usePlateaus,
	useTrainingSignals,
	useUpdatePlateauPreferences,
} from '@/lib/api/hooks/useWorkoutSession'
import { PROGRESS_HASH_RULES } from '@/lib/utils/progress-tabs'

/**
 * Progress › Overview (UX-11): how training is going and whether anything
 * is worth a look -- goals, plateaus and training signals with the deload
 * suggestion. An old `/progress#…` link to a section that moved is sent to
 * its tab before anything renders.
 */
export default function ProgressOverviewPage() {
	const forwarding = useHashForward(PROGRESS_HASH_RULES)
	const weightUnit = useWeightUnit()
	const personalGoals = usePersonalGoals()
	const plateaus = usePlateaus()
	const plateauPreferences = useUpdatePlateauPreferences()
	const trainingSignals = useTrainingSignals()
	const deloadSuggestion = useDeloadSuggestion()

	if (forwarding) return null

	return (
		<ProgressTab>
			<PersonalGoals
				data={personalGoals.data}
				weightUnit={weightUnit}
				isPending={personalGoals.isPending}
				isError={Boolean(personalGoals.error)}
				onRetry={() => void personalGoals.retry()}
			/>

			<PlateauWatch
				data={plateaus.data}
				weightUnit={weightUnit}
				isPending={plateaus.isPending}
				isError={plateaus.isError}
				onRetry={() => void plateaus.refetch()}
				savingMinSessions={
					plateauPreferences.isPending
						? plateauPreferences.variables?.minSessions
						: undefined
				}
				saveFailed={plateauPreferences.isError}
				onMinSessionsChange={minSessions =>
					plateauPreferences.mutate({ minSessions })
				}
			/>

			<TrainingSignals
				data={trainingSignals.data}
				weightUnit={weightUnit}
				isPending={trainingSignals.isPending}
				isError={trainingSignals.isError}
				onRetry={() => void trainingSignals.refetch()}
				deloadSuggestion={deloadSuggestion.data}
			/>
		</ProgressTab>
	)
}
