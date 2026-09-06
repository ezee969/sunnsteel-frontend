'use client'

import { Trophy } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkoutProgress } from '@/lib/api/hooks/useWorkoutSession'
import { formatTimeAgo } from '@/lib/utils/date'

import PersonalRecordItem from './PersonalRecordItem'

/**
 * Heaviest completed set per exercise, most recent record first.
 *
 * Records are derived server-side from the logged sets, so they cannot drift
 * from the history that produced them — there is no stored PR table to fall
 * out of sync.
 */
export default function PersonalRecords() {
	const { data } = useWorkoutProgress()
	const records = data?.personalRecords ?? []

	return (
		<Card className="border-border/40">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
					<Trophy className="h-4 w-4 text-primary" aria-hidden />
					Personal Records
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{records.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Log a few sets and your records will show up here.
					</p>
				) : (
					records.map((record, index) => (
						<PersonalRecordItem
							key={record.exerciseId}
							exercise={record.exerciseName}
							timeAgo={formatTimeAgo(record.achievedAt)}
							weight={`${record.weight} kg × ${record.reps}`}
							showSeparator={index < records.length - 1}
						/>
					))
				)}
			</CardContent>
		</Card>
	)
}
