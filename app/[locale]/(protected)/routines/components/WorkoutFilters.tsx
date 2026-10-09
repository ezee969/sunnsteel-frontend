'use client'

import { Archive, Heart, LayoutGrid } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
	ClassicalIcon,
	ClassicalIconName,
} from '@/components/icons/ClassicalIcon'
import { NativeSelect } from '@/components/ui/native-select'
import { ToggleOption, ToggleRow } from '@/components/ui/toggle-row'
import type { MessageKey } from '@/i18n/translator'

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
}

const filters: readonly FilterItem[] = [
	{
		id: 'all',
		labelKey: 'filterAllLabel',
		shortLabelKey: 'filterAllShort',
		icon: LayoutGrid,
		classicalName: 'pillar-icon',
	},
	{
		id: 'favorites',
		labelKey: 'filterFavoritesLabel',
		shortLabelKey: 'filterFavoritesShort',
		icon: Heart,
	},
	{
		id: 'completed',
		labelKey: 'filterCompletedLabel',
		shortLabelKey: 'filterCompletedShort',
		icon: Archive,
	},
] as const

export default function WorkoutFilters({
	activeFilter,
	onFilterChange,
}: WorkoutFiltersProps) {
	const t = useTranslations('routines.listing')
	return (
		<>
			{/* TD-54: below `lg` the buttons wrapped to two rows, or pushed
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
					<option key={filter.id} value={filter.id}>
						{t(filter.shortLabelKey)}
					</option>
				))}
			</NativeSelect>
			{/* UX-25 (§28.2): a filter is a toggle, not a command. */}
			<ToggleRow aria-label={t('show')} className="hidden lg:flex">
				{filters.map(filter => (
					<ToggleOption
						key={filter.id}
						pressed={activeFilter === filter.id}
						onClick={() => onFilterChange(filter.id)}
					>
						{filter.classicalName ? (
							<ClassicalIcon name={filter.classicalName} aria-hidden />
						) : (
							<filter.icon aria-hidden />
						)}
						{t(filter.labelKey)}
					</ToggleOption>
				))}
			</ToggleRow>
		</>
	)
}
