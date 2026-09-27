'use client'

import { Clock, Heart, LayoutGrid, ListChecks } from 'lucide-react'

import {
	ClassicalIcon,
	ClassicalIconName,
} from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

import type { WorkoutFilter } from '../types'

interface WorkoutFiltersProps {
	activeFilter: WorkoutFilter
	onFilterChange: (filter: WorkoutFilter) => void
}

type FilterItem = {
	id: WorkoutFilter
	label: string
	/** The option's wording in the phone select, where space is short. */
	shortLabel: string
	icon: React.ComponentType<{ className?: string }>
	classicalName?: ClassicalIconName
	disabled: boolean
}

const filters: readonly FilterItem[] = [
	{
		id: 'all',
		label: 'All Workout Routines',
		shortLabel: 'All routines',
		icon: LayoutGrid,
		classicalName: 'pillar-icon',
		disabled: false,
	},
	{
		id: 'recent',
		label: 'Recent',
		shortLabel: 'Recent',
		icon: Clock,
		classicalName: 'hourglass',
		disabled: true,
	},
	{
		id: 'favorites',
		label: 'Favorites',
		shortLabel: 'Favorites',
		icon: Heart,
		disabled: false,
	},
	{
		id: 'completed',
		label: 'Completed',
		shortLabel: 'Completed',
		icon: ListChecks,
		disabled: false,
	},
] as const

export default function WorkoutFilters({
	activeFilter,
	onFilterChange,
}: WorkoutFiltersProps) {
	return (
		<>
			{/* TD-54: below `lg` the four buttons wrapped to two rows, or pushed
			    Create Routine onto a row of its own; one select keeps both on a
			    single line. */}
			<label htmlFor="routine-filter" className="sr-only">
				Show
			</label>
			<NativeSelect
				id="routine-filter"
				value={activeFilter}
				onChange={event => onFilterChange(event.target.value as WorkoutFilter)}
				className="min-w-0 flex-1 lg:hidden"
			>
				{filters.map(filter => (
					<option key={filter.id} value={filter.id} disabled={filter.disabled}>
						{filter.shortLabel}
					</option>
				))}
			</NativeSelect>
			<div className="hidden flex-wrap gap-2 lg:flex">
				{filters.map(filter => (
					<Button
						key={filter.id}
						// Create Routine is the row's one filled action (§11.4).
						variant={activeFilter === filter.id ? 'secondary' : 'outline'}
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
		</>
	)
}
