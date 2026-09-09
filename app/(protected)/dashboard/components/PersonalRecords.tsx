'use client'

import { Trophy } from 'lucide-react'

import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useWorkoutProgress } from '@/lib/api/hooks/useWorkoutSession'
import { formatTimeAgo } from '@/lib/utils/date'
import { formatWeight } from '@/lib/utils/weight-unit'

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
	const weightUnit = useWeightUnit()
	const records = data?.personalRecords ?? []

	return (
		// §11.5 — ruled, like every other list on this page.
		<section>
			<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
				<Trophy className="h-4 w-4 text-ink-3" aria-hidden />
				Personal Records
			</h2>
			<div className="pt-1">
				{records.length === 0 ? (
					<p className="type-body-sm py-3 text-ink-3">
						Log a few sets and your records will show up here.
					</p>
				) : (
					records.map((record, index) => (
						<PersonalRecordItem
							key={record.exerciseId}
							exercise={record.exerciseName}
							timeAgo={formatTimeAgo(record.achievedAt)}
							weight={`${formatWeight(record.weight, weightUnit)} × ${record.reps}`}
							showSeparator={index < records.length - 1}
						/>
					))
				)}
			</div>
		</section>
	)
}
