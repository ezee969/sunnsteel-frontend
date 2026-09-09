import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { ClassicalLoader } from '@/components/ui/classical-loader'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	useWorkoutProgress,
	useWorkoutStats,
} from '@/lib/api/hooks/useWorkoutSession'
import {
	formatWeightAmount,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

import StatCard from './StatCard'

// FIX-08: these are shared app milestones, not the user's goals. Nothing in
// WorkoutStatsResponse or WorkoutProgressResponse carries a personal target, so
// the copy below must not call them one. PROG-08 (personal goals) supplies real
// per-user values; replace these constants when it lands.
const WEEKLY_MILESTONE = 4
const TOTAL_SESSIONS_MILESTONE = 50

export default function StatsOverview() {
	const weightUnit = useWeightUnit()
	const { data, isPending, isError, refetch, isFetching } = useWorkoutStats()
	const { data: progress } = useWorkoutProgress()

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
			<div
				role="alert"
				className="space-y-3 rounded-sm border border-rule bg-surface p-4"
			>
				<p className="type-body-sm text-foreground">
					Workout statistics could not be loaded.
				</p>
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
	const currentStreak = progress?.currentStreakDays ?? 0
	const bestStreak = progress?.bestStreakDays ?? 0
	const totalVolumeKg = progress?.totalVolumeKg ?? 0
	const displayVolume = kilogramsToDisplayWeight(totalVolumeKg, weightUnit)
	const compactVolume = displayVolume / 1000
	const compactVolumeUnit = weightUnit === 'KG' ? 't' : 'k lb'

	const weeklyWorkoutsProgress = Math.min(
		100,
		Math.round((weeklyWorkoutsCount / WEEKLY_MILESTONE) * 100),
	)
	const activeDaysProgress = Math.min(
		100,
		Math.round((activeDaysThisWeek / 7) * 100),
	)
	const sessionsToMilestone = Math.max(
		0,
		TOTAL_SESSIONS_MILESTONE - totalCompleted,
	)

	return (
		// §10.1 — the stat row is one ruled band, not a card grid. The 1px lines
		// are the container's own ground showing through a `gap-px`, so they run
		// unbroken in both directions and need no per-cell border bookkeeping.
		//
		// The third column arrives at `lg`, not `sm`, and the band never opens to
		// six. Both are the same measured constraint: the numeral rank steps to
		// 52px at 768, where the shell's main column is only 512px wide, so three
		// columns there gave a 170px cell for a value that can need ~196px — the
		// first sweep caught 16px of overflow at exactly that width. Six across at
		// 1440 fails the same way (§10.2 — a value is never clipped to fit a
		// column count).
		<div className="grid grid-cols-2 gap-px border-y border-rule bg-rule-faint lg:grid-cols-3">
			<StatCard
				icon={
					<ClassicalIcon
						name="two-dumbbells"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title="Weekly Workouts"
				value={String(weeklyWorkoutsCount)}
				unit={`/ ${WEEKLY_MILESTONE}`}
				subtitle="Workouts completed this week"
				progress={weeklyWorkoutsProgress}
				progressText={`${weeklyWorkoutsProgress}% of milestone`}
				additionalText={
					weeklyWorkoutsCount >= WEEKLY_MILESTONE ? 'Milestone met' : 'Active'
				}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="compass"
						className="h-4 w-4 shrink-0"
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
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title="Total Workouts"
				value={String(totalCompleted)}
				subtitle="Total completed training sessions"
				progress={totalCompleted}
				progressMax={Math.max(TOTAL_SESSIONS_MILESTONE, totalCompleted)}
				progressText={`Milestone: ${TOTAL_SESSIONS_MILESTONE} sessions`}
				additionalText={
					sessionsToMilestone > 0
						? `${sessionsToMilestone} to go`
						: 'Milestone met'
				}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="shield"
						className="h-4 w-4 shrink-0"
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
			<StatCard
				icon={
					<ClassicalIcon
						name="torch"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title="Current Streak"
				value={String(currentStreak)}
				unit="days"
				subtitle="Training days without a long gap"
				progress={currentStreak}
				progressMax={Math.max(bestStreak, currentStreak, 1)}
				progressText={`Best: ${bestStreak} days`}
				additionalText={currentStreak > 0 ? 'Active' : 'Resting'}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="bicep-flexing"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title="Total Volume"
				value={compactVolume.toFixed(1)}
				unit={compactVolumeUnit}
				subtitle="Lifetime weight moved"
				progress={compactVolume}
				progressMax={Math.max(100, Math.ceil(compactVolume / 50) * 50)}
				progressText={`${formatWeightAmount(totalVolumeKg, weightUnit)} ${getWeightUnitLabel(weightUnit)} lifted`}
				additionalText={compactVolume >= 100 ? 'Heavy' : 'Building'}
			/>
		</div>
	)
}
