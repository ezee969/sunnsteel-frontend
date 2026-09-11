'use client'

import { Clock, Heart, LayoutGrid, ListChecks } from 'lucide-react'

import {
	ClassicalIcon,
	ClassicalIconName,
} from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { WorkoutFilter } from '../types'

interface WorkoutFiltersProps {
	activeFilter: WorkoutFilter
	onFilterChange: (filter: WorkoutFilter) => void
}

type FilterItem = {
	id: WorkoutFilter
	label: string
	icon: React.ComponentType<{ className?: string }>
	classicalName?: ClassicalIconName
	disabled: boolean
}

const filters: readonly FilterItem[] = [
	{
		id: 'all',
		label: 'All Workout Routines',
		icon: LayoutGrid,
		classicalName: 'pillar-icon',
		disabled: false,
	},
	{
		id: 'recent',
		label: 'Recent',
		icon: Clock,
		classicalName: 'hourglass',
		disabled: true,
	},
	{ id: 'favorites', label: 'Favorites', icon: Heart, disabled: false },
	{ id: 'completed', label: 'Completed', icon: ListChecks, disabled: false },
] as const

export default function WorkoutFilters({
	activeFilter,
	onFilterChange,
}: WorkoutFiltersProps) {
	return (
		<div className="w-full">
			<div className="flex flex-wrap gap-2">
				{filters.map(filter => (
					<Button
						key={filter.id}
						variant={activeFilter === filter.id ? 'default' : 'outline'}
						size={'sm'}
						aria-pressed={activeFilter === filter.id}
						className={cn('flex-shrink-0 gap-2', 'h-11 sm:h-10 sm:px-4')}
						onClick={() => onFilterChange(filter.id as WorkoutFilter)}
						disabled={filter.disabled}
					>
						{filter.classicalName ? (
							<ClassicalIcon
								name={filter.classicalName}
								className="h-4 w-4 flex-shrink-0"
								aria-hidden
							/>
						) : (
							<filter.icon className="h-4 w-4 flex-shrink-0" />
						)}
						<span className="truncate">{filter.label}</span>
					</Button>
				))}
			</div>
		</div>
	)
}
