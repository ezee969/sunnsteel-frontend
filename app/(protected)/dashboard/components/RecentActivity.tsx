'use client'

import { Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkoutProgress } from '@/lib/api/hooks/useWorkoutSession'
import { formatTimeAgo } from '@/lib/utils/date'
import { formatTimeReadable } from '@/lib/utils/time'

import ActivityItem from './ActivityItem'

/**
 * The last few finished sessions, with the volume each one actually moved.
 */
export default function RecentActivity() {
	const router = useRouter()
	const { data } = useWorkoutProgress()
	const entries = data?.recentActivity ?? []

	return (
		<Card className="border-border/40">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
					<Activity className="h-4 w-4 text-primary" aria-hidden />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{entries.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Finished workouts will appear here.
					</p>
				) : (
					entries.map((entry, index) => (
						<button
							key={entry.sessionId}
							type="button"
							className="w-full text-left"
							onClick={() =>
								router.push(`/workouts/sessions/${entry.sessionId}`)
							}
						>
							<ActivityItem
								icon={
									<ClassicalIcon
										name="two-dumbbells"
										className="h-5 w-5"
										aria-hidden
									/>
								}
								title={`${entry.routineName} — ${entry.dayName}`}
								time={formatTimeAgo(entry.endedAt ?? entry.startedAt)}
								badges={[
									`${entry.completedSets} sets`,
									`${entry.totalVolumeKg.toLocaleString()} kg`,
									...(entry.durationSec
										? [formatTimeReadable(entry.durationSec)]
										: []),
								]}
								showSeparator={index < entries.length - 1}
							/>
						</button>
					))
				)}
			</CardContent>
		</Card>
	)
}
