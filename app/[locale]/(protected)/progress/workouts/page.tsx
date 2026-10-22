'use client'

import { ConsistencyCalendar } from '@/features/progress/consistency-calendar'
import { useProgressControls } from '@/features/progress/progress-controls'
import { ProgressTab } from '@/features/progress/progress-tab'
import { SessionComparison } from '@/features/progress/session-comparison'
import { useEntitlement } from '@/lib/api/hooks/useBilling'
import { useSessionComparison } from '@/lib/api/hooks/useWorkoutSession'

/** Progress › Workouts (UX-11): which days were trained, and how two compare. */
export default function ProgressWorkoutsPage() {
	const { routineDayId, setRoutineDayId } = useProgressControls()
	// BILL-02: comparison is Pro's; without it the section says so.
	const comparison = useEntitlement('TRAINING_COMPARISON')
	const sessionComparison = useSessionComparison(
		routineDayId,
		comparison.allowed === true,
	)

	return (
		<ProgressTab>
			<ConsistencyCalendar />

			<SessionComparison
				data={sessionComparison.data}
				selectedRoutineDayId={routineDayId}
				isPending={sessionComparison.isPending}
				isError={sessionComparison.isError}
				onRoutineDayChange={setRoutineDayId}
				onRetry={() => void sessionComparison.refetch()}
				locked={comparison.allowed === false}
			/>
		</ProgressTab>
	)
}
