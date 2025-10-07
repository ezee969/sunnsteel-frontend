'use client'

import { ChevronDown, ChevronRight, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ExerciseGroup } from '@/lib/utils/exercise-groups'
import { formatMuscleGroups } from '@/lib/utils/muscle-groups'
import { createEnterSpaceHandler } from '@/lib/utils/keyboard'
import { SetComparisonRow } from './set-comparison-row'

interface HistoryExerciseGroupProps {
	group: ExerciseGroup
	collapsed: boolean
	onToggle: () => void
}

export function HistoryExerciseGroup({
	group,
	collapsed,
	onToggle,
}: HistoryExerciseGroupProps) {
	return (
		<Card>
			<CardHeader
				role="button"
				tabIndex={0}
				onClick={onToggle}
				onKeyDown={createEnterSpaceHandler(onToggle)}
				className="pb-3 cursor-pointer"
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Dumbbell className="h-5 w-5 text-muted-foreground" />
						<CardTitle className="text-lg">{group.exercise.name}</CardTitle>
					</div>
					<Badge variant="outline" className="text-xs">
						{formatMuscleGroups(group.exercise.primaryMuscles)} • {group.exercise.equipment}
					</Badge>
					{collapsed ? (
						<ChevronRight className="h-4 w-4 text-muted-foreground" />
					) : (
						<ChevronDown className="h-4 w-4 text-muted-foreground" />
					)}
				</div>
			</CardHeader>
			{!collapsed && (
				<CardContent className="pt-0">
					<div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
						<div className="col-span-2">Set</div>
						<div className="col-span-3">Planned</div>
						<div className="col-span-2">Reps</div>
						<div className="col-span-2">Weight</div>
						<div className="col-span-2">RPE</div>
						<div className="col-span-1">✓</div>
					</div>

					<div className="space-y-2">
						{group.plannedSets.map((plannedSet) => {
							const performedSet = group.performedSets.find(
								(set) => set.setNumber === plannedSet.setNumber,
							)
							return (
								<SetComparisonRow
									key={`${group.routineExerciseId}-${plannedSet.id ?? plannedSet.setNumber}`}
									plannedSet={plannedSet}
									performedSet={performedSet}
								/>
							)
						})}
					</div>
				</CardContent>
			)}
		</Card>
	)
}
