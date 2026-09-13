'use client'

import { Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { EmptyModule } from '@/components/layout/empty-module'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { useWorkoutProgress } from '@/lib/api/hooks/useWorkoutSession'
import { formatTimeAgo } from '@/lib/utils/date'
import { getRecentActivityEmptyState } from '@/lib/utils/empty-states'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

import ActivityItem from './ActivityItem'

/**
 * The last few finished sessions, with the volume each one actually moved.
 */
export default function RecentActivity() {
	const router = useRouter()
	const weightUnit = useWeightUnit()
	const { data } = useWorkoutProgress()
	// Same key the dashboard gate already waits on, so this adds no request.
	const { data: routines } = useRoutines()
	const entries = data?.recentActivity ?? []
	const hasRoutines = (routines?.length ?? 0) > 0

	return (
		// §11.5 — `ruled` is the default for a list: no fill, no box, a section
		// heading over a rule with `.rule-row` between items. This was a card
		// containing cards.
		<section>
			<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
				<Activity className="h-4 w-4 text-ink-3" aria-hidden />
				Recent Activity
			</h2>
			<div className="pt-1">
				{entries.length === 0 ? (
					<EmptyModule {...getRecentActivityEmptyState(hasRoutines)} />
				) : (
					entries.map((entry, index) => (
						<button
							key={entry.sessionId}
							type="button"
							className="block w-full text-left transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface"
							onClick={() =>
								router.push(`/workouts/sessions/${entry.sessionId}`)
							}
						>
							<ActivityItem
								icon={
									<ClassicalIcon
										name="two-dumbbells"
										className="h-4 w-4"
										aria-hidden
									/>
								}
								title={`${entry.routineName} — ${entry.dayName}`}
								time={formatTimeAgo(entry.endedAt ?? entry.startedAt)}
								badges={[
									`${entry.completedSets} sets`,
									`${formatWeightAmount(entry.totalVolumeKg, weightUnit)} ${getWeightUnitLabel(weightUnit)}`,
									...(entry.durationSec
										? [formatDuration(entry.durationSec)]
										: []),
								]}
								showSeparator={index < entries.length - 1}
							/>
						</button>
					))
				)}
			</div>
		</section>
	)
}
