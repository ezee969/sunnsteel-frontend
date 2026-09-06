import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { ClassicalLoader } from '@/components/ui/classical-loader'
import { useWorkoutStats } from '@/lib/api/hooks/useWorkoutSession'

import StatCard from './StatCard'

const WEEKLY_GOAL = 4

export default function StatsOverview() {
	const { data, isPending, isError, refetch, isFetching } = useWorkoutStats()

	// The dashboard page gates the first paint, so this only shows when the stats
	// query restarts later — the week-bounded query key rolls over at midnight
	// on the week boundary. Matches the initial skeleton so nothing reflows.
	if (isPending) {
		return (
			<div className="flex min-h-40 items-center justify-center">
				<ClassicalLoader label="Loading workout statistics" />
			</div>
		)
	}

	if (isError || !data) {
		return (
			<div role="alert" className="rounded-lg border p-4 space-y-3">
				<p>Workout statistics could not be loaded.</p>
				<Button onClick={() => refetch()} disabled={isFetching}>
					Try again
				</Button>
			</div>
		)
	}

	const {
		weeklyWorkoutsCount,
		activeDaysThisWeek,
		totalCompleted,
		completionRate,
	} = data
	const weeklyWorkoutsProgress = Math.min(
		100,
		Math.round((weeklyWorkoutsCount / WEEKLY_GOAL) * 100),
	)
	const activeDaysProgress = Math.min(
		100,
		Math.round((activeDaysThisWeek / 7) * 100),
	)

	return (
		<div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
			<StatCard
				icon={
					<ClassicalIcon
						name="two-dumbbells"
						className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
						aria-hidden
					/>
				}
				title="Weekly Workouts"
				value={String(weeklyWorkoutsCount)}
				unit={`/ ${WEEKLY_GOAL}`}
				subtitle="Workouts completed this week"
				progress={weeklyWorkoutsProgress}
				progressText={`${weeklyWorkoutsProgress}% of target`}
				additionalText={
					weeklyWorkoutsCount >= WEEKLY_GOAL ? 'Goal Met!' : 'Active'
				}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="compass"
						className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
						aria-hidden
					/>
				}
				title="Active Days"
				value={String(activeDaysThisWeek)}
				unit="/ 7"
				subtitle="Active training days this week"
				progress={activeDaysProgress}
				progressText={`${activeDaysThisWeek} days active`}
				additionalText={activeDaysThisWeek >= 3 ? 'Consistent' : 'Resting'}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="laurel-wreath"
						className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
						aria-hidden
					/>
				}
				title="Total Workouts"
				value={String(totalCompleted)}
				subtitle="Total completed training sessions"
				progress={totalCompleted}
				progressMax={Math.max(50, totalCompleted)}
				progressText="Target: 50 Sessions"
				additionalText={`${Math.max(0, 50 - totalCompleted)} left`}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="shield"
						className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
						aria-hidden
					/>
				}
				title="Completion Rate"
				value={`${completionRate}%`}
				subtitle="Percentage of completed workouts"
				progress={completionRate}
				progressText="Across all training sessions"
				additionalText={completionRate >= 90 ? 'Excellent' : 'On Track'}
			/>
		</div>
	)
}
