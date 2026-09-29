'use client'

import { Clock, Heart, LayoutGrid, ListChecks } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
	ClassicalIcon,
	ClassicalIconName,
} from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import type { MessageKey } from '@/i18n/translator'
import { cn } from '@/lib/utils'

import type { WorkoutFilter } from '../types'

interface WorkoutFiltersProps {
	activeFilter: WorkoutFilter
	onFilterChange: (filter: WorkoutFilter) => void
}

type FilterItem = {
	id: WorkoutFilter
	labelKey: MessageKey<'routines.listing'>
	/** The option's wording in the phone select, where space is short. */
	shortLabelKey: MessageKey<'routines.listing'>
	icon: React.ComponentType<{ className?: string }>
	classicalName?: ClassicalIconName
	disabled: boolean
}

const filters: readonly FilterItem[] = [
	{
		id: 'all',
		labelKey: 'filterAllLabel',
		shortLabelKey: 'filterAllShort',
		icon: LayoutGrid,
		classicalName: 'pillar-icon',
		disabled: false,
	},
	{
		id: 'recent',
		labelKey: 'filterRecentLabel',
		shortLabelKey: 'filterRecentShort',
		icon: Clock,
		classicalName: 'hourglass',
		disabled: true,
	},
	{
		id: 'favorites',
		labelKey: 'filterFavoritesLabel',
		shortLabelKey: 'filterFavoritesShort',
		icon: Heart,
		disabled: false,
	},
	{
		id: 'completed',
		labelKey: 'filterCompletedLabel',
		shortLabelKey: 'filterCompletedShort',
		icon: ListChecks,
		disabled: false,
	},
] as const

export default function WorkoutFilters({
	activeFilter,
	onFilterChange,
}: WorkoutFiltersProps) {
	const t = useTranslations('routines.listing')
	return (
		<>
			{/* TD-54: below `lg` the four buttons wrapped to two rows, or pushed
			    Create Routine onto a row of its own; one select keeps both on a
			    single line. */}
			<label htmlFor="routine-filter" className="sr-only">
				{t('show')}
			</label>
			<NativeSelect
				id="routine-filter"
				value={activeFilter}
				onChange={event => onFilterChange(event.target.value as WorkoutFilter)}
				className="min-w-0 flex-1 lg:hidden"
			>
				{filters.map(filter => (
					<option key={filter.id} value={filter.id} disabled={filter.disabled}>
						{t(filter.shortLabelKey)}
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
						<span className="truncate">{t(filter.labelKey)}</span>
					</Button>
				))}
			</div>
		</>
	)
}
