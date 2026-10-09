'use client'

import type { MovementPattern, MuscleGroup } from '@sunsteel/contracts'
import {
	Check,
	History,
	Plus,
	RefreshCw,
	Search,
	SlidersHorizontal,
	Star,
	UserRound,
	X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { type ReactNode, useMemo, useState } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleOption, ToggleRow } from '@/components/ui/toggle-row'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useExercises, useStarredExercises } from '@/lib/api/hooks/useExercises'
import { useTrainingLocations } from '@/lib/api/hooks/useTrainingLocations'
import { useTrainedExercises } from '@/lib/api/hooks/useWorkoutSession'
import type { Exercise } from '@/lib/api/types/exercise.type'
import {
	isArchivedExercise,
	isCustomExercise,
} from '@/lib/utils/custom-exercises'
import {
	activeCatalogFilterCount,
	type CatalogEquipmentFilter,
	catalogFilterOptions,
	type CatalogOption,
	filterCatalog,
	formatCatalogCount,
	getCatalogEmptyState,
	getGymFilterUnavailableState,
	GYM_EQUIPMENT_FILTER,
	hasActiveCatalogFilters,
	mechanicLabel,
	movementPatternLabel,
} from '@/lib/utils/exercise-catalog'
import {
	defaultTrainingLocation,
	equipmentLabel,
	listedEquipmentAt,
} from '@/lib/utils/exercise-equipment'
import { getFriendlyMuscleNames } from '@/lib/utils/muscle-groups'

import { CustomExerciseDialog } from './custom-exercise-dialog'
import { StarToggle } from './star-toggle'
import { useCatalogFilters } from './use-catalog-filters'

// Below `lg` a row is two lines, title then inline data (§10). From `lg` the
// shell leaves 768px, enough for the ledger's four columns.
const ROW_GRID =
	'lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_7.5rem] lg:gap-6'

const formatDate = (locale: Locale) => (value: string) =>
	dateFormatter(locale, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date(value))

function RowsSkeleton({ label }: { label: string }) {
	return (
		<div role="status" aria-label={label} className="space-y-3 pt-3">
			{Array.from({ length: 6 }, (_, index) => (
				<Skeleton key={index} className="h-14" />
			))}
		</div>
	)
}

export function ExerciseCatalogSkeleton() {
	const t = useTranslations('catalog.exercisesUi')
	return (
		<div className="space-y-6">
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }, (_, index) => (
					<Skeleton key={index} className="h-16" />
				))}
			</div>
			<RowsSkeleton label={t('loadingExercises')} />
		</div>
	)
}

function RetryAlert({
	title,
	description,
	onRetry,
}: {
	title: string
	description: string
	onRetry: () => void
}) {
	const t = useTranslations('catalog.exercisesUi')
	return (
		<div role="alert" className="mt-3 border border-rule bg-surface p-6">
			<p className="type-panel text-foreground">{title}</p>
			<p className="type-body-sm mt-1 text-ink-3">{description}</p>
			<Button
				type="button"
				variant="outline"
				className="mt-4"
				onClick={onRetry}
			>
				<RefreshCw className="size-4" aria-hidden />
				{t('retry')}
			</Button>
		</div>
	)
}

function FilterSelect<T extends string>({
	id,
	label,
	anyLabel,
	value,
	options,
	disabled,
	onChange,
	children,
}: {
	id: string
	label: string
	anyLabel: string
	value: T | null
	options: CatalogOption<T>[]
	disabled: boolean
	onChange: (value: T | null) => void
	children?: ReactNode
}) {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<Label htmlFor={id}>{label}</Label>
			<NativeSelect
				id={id}
				value={value ?? ''}
				disabled={disabled}
				onChange={event => onChange((event.target.value || null) as T | null)}
			>
				<option value="">{anyLabel}</option>
				{children}
				{options.map(option => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</NativeSelect>
		</div>
	)
}

function ExerciseRow({
	exercise,
	lastTrainedAt,
	historyKnown,
}: {
	exercise: Exercise
	lastTrainedAt: string | undefined
	historyKnown: boolean
}) {
	const locale = useLocale() as Locale
	const t = useTranslations('catalog.exercisesUi')
	const tMuscles = useTranslations('routines.muscles')
	const tEquipment = useTranslations('routines.equipment')
	const tExercises = useTranslations('catalog.exercises')
	const primary = getFriendlyMuscleNames(
		exercise.primaryMuscles,
		tMuscles,
	).join(', ')
	const secondary = getFriendlyMuscleNames(
		exercise.secondaryMuscles,
		tMuscles,
	).join(', ')
	const movement = [
		exercise.movementPattern
			? movementPatternLabel(t, exercise.movementPattern)
			: null,
		exercise.mechanic ? mechanicLabel(t, exercise.mechanic) : null,
	]
		.filter(Boolean)
		.join(' · ')
	const equipment = exercise.equipmentRequired
		.map(item => equipmentLabel(item, tEquipment))
		.join(', ')

	return (
		<li className={`rule-row py-3 ${ROW_GRID} lg:items-baseline`}>
			<div className="flex min-w-0 items-start gap-1">
				<StarToggle
					exerciseId={exercise.id}
					exerciseName={exerciseLabel(exercise.name, tExercises)}
					className="-ml-2.5 -mt-2"
				/>
				<div className="min-w-0">
					<h3 className="type-panel text-foreground">
						<Link
							href={`/exercises/${exercise.id}`}
							className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							{exerciseLabel(exercise.name, tExercises)}
						</Link>
					</h3>
					{isCustomExercise(exercise) ? (
						<p className="type-body-sm text-ink-3">
							{t('yoursRow', {
								archived: isArchivedExercise(exercise) ? 'yes' : 'no',
							})}
						</p>
					) : null}
					<p className="type-body-sm mt-0.5 text-ink-2">
						<span className="sr-only">{t('musclesSr')}</span>
						{primary || t('notClassified')}
						{secondary ? (
							<span className="text-ink-3">
								{t('alsoMuscles', { muscles: secondary })}
							</span>
						) : null}
					</p>
				</div>
			</div>
			{/* One inline line below `lg`; `lg:contents` turns each part into its
			    own ledger column, and the middots drop out. */}
			<p className="type-body-sm mt-1 text-ink-3 lg:contents">
				<span className="lg:text-ink-2">
					<span className="sr-only">{t('movementSr')}</span>
					{movement || t('notClassified')}
				</span>
				<span aria-hidden className="lg:hidden">
					{' · '}
				</span>
				<span className="lg:text-ink-2">
					<span className="sr-only">{t('equipmentSr')}</span>
					{equipment || t('notListed')}
				</span>
				{lastTrainedAt ? (
					<>
						<span aria-hidden className="lg:hidden">
							{' · '}
						</span>
						<span className="lg:text-right">
							<span className="lg:sr-only">{t('lastTrainedSr')}</span>
							<time
								dateTime={lastTrainedAt}
								className="type-data whitespace-nowrap text-ink-2"
							>
								{formatDate(locale)(lastTrainedAt)}
							</time>
						</span>
					</>
				) : (
					<span className="hidden text-right lg:block">
						{historyKnown ? (
							<>
								<span aria-hidden>—</span>
								<span className="sr-only">{t('notTrainedYet')}</span>
							</>
						) : null}
					</span>
				)}
			</p>
		</li>
	)
}

export function ExerciseCatalog() {
	const { filters, setQuery, update, clear } = useCatalogFilters()
	const router = useRouter()
	const t = useTranslations('catalog.exercisesUi')
	const tMuscles = useTranslations('routines.muscles')
	const tEquipment = useTranslations('routines.equipment')
	const tExercises = useTranslations('catalog.exercises')
	const [creating, setCreating] = useState(false)
	const catalog = useExercises()
	const trained = useTrainedExercises()
	const locations = useTrainingLocations()
	const stars = useStarredExercises()
	const starredIds = useMemo(
		() =>
			stars.data
				? new Set(stars.data.items.map(item => item.exerciseId))
				: null,
		[stars.data],
	)

	const exercises = useMemo(() => catalog.data ?? [], [catalog.data])
	const lastTrained = useMemo(
		() =>
			new Map(
				(trained.data ?? []).map(item => [
					item.exerciseId,
					item.lastPerformedAt,
				]),
			),
		[trained.data],
	)
	const trainedIds = useMemo(
		() => (trained.data ? new Set(lastTrained.keys()) : null),
		[lastTrained, trained.data],
	)
	const gym = defaultTrainingLocation(locations.data)
	const listedEquipment = useMemo(() => listedEquipmentAt(gym), [gym])
	const options = useMemo(
		() => catalogFilterOptions(exercises, filters, tMuscles, tEquipment, t),
		[exercises, filters, tMuscles, tEquipment, t],
	)
	const results = useMemo(
		() =>
			filterCatalog(exercises, filters, {
				trainedIds,
				listedEquipment,
				starredIds,
				label: name => exerciseLabel(name, tExercises),
			}),
		[exercises, filters, listedEquipment, starredIds, trainedIds, tExercises],
	)
	// EXER-06: the count is of what the current view can hold.
	const customCount = useMemo(
		() => exercises.filter(isCustomExercise).length,
		[exercises],
	)
	const viewTotal = filters.mine
		? customCount
		: exercises.filter(exercise => !isArchivedExercise(exercise)).length
	const hasActiveFilters = hasActiveCatalogFilters(filters)
	const filterCount = activeCatalogFilterCount(filters)
	// UX-05: closed on a phone until asked for; ignored from `lg`, where the
	// panel always shows.
	const [filtersOpen, setFiltersOpen] = useState(false)
	const usesGym = filters.equipment === GYM_EQUIPMENT_FILTER

	let body: ReactNode
	let showCount = false
	if (catalog.isPending) {
		body = <RowsSkeleton label={t('loadingExercises')} />
	} else if (catalog.isError) {
		body = (
			<RetryAlert
				title={t('catalogUnavailable')}
				description={t('catalogUnavailableBody')}
				onRetry={() => void catalog.refetch()}
			/>
		)
	} else if (filters.trained && trained.isPending) {
		body = <RowsSkeleton label={t('loadingHistory')} />
	} else if (filters.trained && trained.isError) {
		body = (
			<RetryAlert
				title={t('historyUnavailable')}
				description={t('historyUnavailableBody')}
				onRetry={() => void trained.refetch()}
			/>
		)
	} else if (filters.starred && stars.isPending) {
		body = <RowsSkeleton label={t('loadingStars')} />
	} else if (filters.starred && stars.isError) {
		body = (
			<RetryAlert
				title={t('starsUnavailable')}
				description={t('starsUnavailableBody')}
				onRetry={() => void stars.refetch()}
			/>
		)
	} else if (usesGym && locations.isPending) {
		body = <RowsSkeleton label={t('loadingLocations')} />
	} else if (usesGym && locations.isError) {
		body = (
			<RetryAlert
				title={t('locationsUnavailable')}
				description={t('locationsUnavailableBody')}
				onRetry={() => void locations.refetch()}
			/>
		)
	} else if (usesGym && !listedEquipment) {
		body = (
			<EmptyModule {...getGymFilterUnavailableState(t, gym?.name ?? null)} />
		)
	} else if (results.length === 0) {
		showCount = exercises.length > 0
		body = (
			<EmptyModule
				{...getCatalogEmptyState({
					t,
					catalogSize: exercises.length,
					filters,
					hasTrainedExercises: trainedIds ? trainedIds.size > 0 : null,
					hasStarredExercises: starredIds ? starredIds.size > 0 : null,
					hasCustomExercises: customCount > 0,
				})}
				onClearFilters={clear}
			/>
		)
	} else {
		showCount = true
		body = (
			<div>
				<div
					aria-hidden
					className={`type-label hidden py-2 text-ink-3 lg:grid ${ROW_GRID}`}
				>
					<span>{t('colExercise')}</span>
					<span>{t('colMovement')}</span>
					<span>{t('colEquipment')}</span>
					<span className="text-right">{t('colLastTrained')}</span>
				</div>
				<ul className="border-t border-rule-faint lg:border-t-0">
					{results.map(exercise => (
						<ExerciseRow
							key={exercise.id}
							exercise={exercise}
							lastTrainedAt={lastTrained.get(exercise.id)}
							historyKnown={Boolean(trainedIds)}
						/>
					))}
				</ul>
			</div>
		)
	}

	return (
		<>
			{/* UX-05 and design system §20.2: below `lg` the search and a Filters
			    toggle share one row pinned at the top of <main> (its negative
			    top cancels <main>'s padding). It sits in the page column, not
			    in the filter section, because a sticky element cannot leave its
			    parent. The other filters open under it; from `lg` everything
			    shows, as before. */}
			<div
				role="search"
				aria-label={t('searchRegion')}
				className="shell-pin shell-bleed z-10 -mb-3 flex items-end gap-2 bg-background py-2 sm:-mb-5 lg:static lg:m-0 lg:p-0"
			>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<Label htmlFor="exercise-search">{t('search')}</Label>
					<div className="relative">
						<Search
							className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
							aria-hidden
						/>
						<Input
							id="exercise-search"
							type="search"
							autoComplete="off"
							placeholder={t('searchPlaceholder')}
							className="pl-9"
							value={filters.q}
							onChange={event => setQuery(event.target.value)}
						/>
					</div>
				</div>
				<Button
					type="button"
					variant={filterCount > 0 ? 'secondary' : 'outline'}
					aria-expanded={filtersOpen}
					aria-controls="exercise-filters"
					onClick={() => setFiltersOpen(open => !open)}
					className="h-11 shrink-0 lg:hidden"
				>
					<SlidersHorizontal className="size-4" aria-hidden />
					{filterCount > 0
						? t('filtersCount', { count: filterCount })
						: t('filters')}
				</Button>
			</div>
			<section aria-label={t('filterRegion')} className="space-y-3">
				<div
					id="exercise-filters"
					className={`space-y-3 ${filtersOpen ? 'block' : 'hidden'} lg:block`}
				>
					<div className="grid gap-3 sm:grid-cols-3">
						<FilterSelect<MuscleGroup>
							id="exercise-muscle"
							label={t('muscle')}
							anyLabel={t('anyMuscle')}
							value={filters.muscle}
							options={options.muscles}
							disabled={!catalog.data}
							onChange={muscle => update({ muscle })}
						/>
						<FilterSelect<CatalogEquipmentFilter>
							id="exercise-equipment"
							label={t('colEquipment')}
							anyLabel={t('anyEquipment')}
							value={filters.equipment}
							options={options.equipment}
							disabled={!catalog.data}
							onChange={equipment => update({ equipment })}
						>
							{listedEquipment || usesGym ? (
								<option value={GYM_EQUIPMENT_FILTER}>
									{gym ? t('listedAt', { name: gym.name }) : t('listedAtGym')}
								</option>
							) : null}
						</FilterSelect>
						<FilterSelect<MovementPattern>
							id="exercise-pattern"
							label={t('colMovement')}
							anyLabel={t('anyMovement')}
							value={filters.pattern}
							options={options.patterns}
							disabled={!catalog.data}
							onChange={pattern => update({ pattern })}
						/>
					</div>
					<div className="flex flex-wrap items-end gap-x-3 gap-y-2">
						{/* UX-25 (§28.2): filters are toggles, not commands. */}
						<ToggleRow aria-label={t('showOnly')}>
							<ToggleOption
								pressed={filters.trained}
								onClick={() => update({ trained: !filters.trained })}
							>
								{filters.trained ? (
									<Check className="size-4" aria-hidden />
								) : (
									<History className="size-4" aria-hidden />
								)}
								{t('trainedByMe')}
							</ToggleOption>
							<ToggleOption
								pressed={filters.starred}
								onClick={() => update({ starred: !filters.starred })}
							>
								{filters.starred ? (
									<Check className="size-4" aria-hidden />
								) : (
									<Star className="size-4" aria-hidden />
								)}
								{t('starred')}
							</ToggleOption>
							<ToggleOption
								pressed={filters.mine}
								onClick={() => update({ mine: !filters.mine })}
							>
								{filters.mine ? (
									<Check className="size-4" aria-hidden />
								) : (
									<UserRound className="size-4" aria-hidden />
								)}
								{t('yours')}
							</ToggleOption>
						</ToggleRow>
						{trained.isError && !filters.trained ? (
							<p className="type-body-sm text-ink-3">
								{t('historyInline')}{' '}
								<button
									type="button"
									className="text-primary underline-offset-4 hover:underline"
									onClick={() => void trained.refetch()}
								>
									{t('retry')}
								</button>
							</p>
						) : null}
						{hasActiveFilters ? (
							<Button type="button" size="sm" variant="ghost" onClick={clear}>
								<X className="size-4" aria-hidden />
								{t('clearFilters')}
							</Button>
						) : null}
					</div>
				</div>
			</section>

			<section aria-labelledby="exercise-catalog-heading">
				<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-2">
					<h2
						id="exercise-catalog-heading"
						className="type-section text-foreground"
					>
						{t('catalogHeading')}
					</h2>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
						<p role="status" className="type-body-sm text-ink-3">
							{showCount
								? formatCatalogCount(t, results.length, viewTotal)
								: null}
						</p>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => setCreating(true)}
						>
							<Plus className="size-4" aria-hidden />
							{t('newExercise')}
						</Button>
					</div>
				</div>
				{body}
			</section>
			<CustomExerciseDialog
				open={creating}
				onOpenChange={setCreating}
				onSaved={exercise => router.push(`/exercises/${exercise.id}`)}
			/>
		</>
	)
}
