'use client'

import type { MovementPattern, MuscleGroup } from '@sunsteel/contracts'
import { Check, History, RefreshCw, Search, X } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useExercises } from '@/lib/api/hooks/useExercises'
import { useTrainingLocations } from '@/lib/api/hooks/useTrainingLocations'
import { useTrainedExercises } from '@/lib/api/hooks/useWorkoutSession'
import type { Exercise } from '@/lib/api/types/exercise.type'
import {
	type CatalogEquipmentFilter,
	catalogFilterOptions,
	type CatalogOption,
	filterCatalog,
	formatCatalogCount,
	getCatalogEmptyState,
	getGymFilterUnavailableState,
	GYM_EQUIPMENT_FILTER,
	hasActiveCatalogFilters,
	MECHANIC_LABELS,
	MOVEMENT_PATTERN_LABELS,
} from '@/lib/utils/exercise-catalog'
import {
	defaultTrainingLocation,
	EQUIPMENT_LABELS,
	listedEquipmentAt,
} from '@/lib/utils/exercise-equipment'
import { getFriendlyMuscleNames } from '@/lib/utils/muscle-groups'

import { useCatalogFilters } from './use-catalog-filters'

// Below `lg` a row is two lines, title then inline data (§10). From `lg` the
// shell leaves 768px, enough for the ledger's four columns.
const ROW_GRID =
	'lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_7.5rem] lg:gap-6'

const formatDate = (value: string) =>
	new Intl.DateTimeFormat(undefined, {
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
	return (
		<div className="space-y-6">
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }, (_, index) => (
					<Skeleton key={index} className="h-16" />
				))}
			</div>
			<RowsSkeleton label="Loading exercises" />
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
				Retry
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
	const primary = getFriendlyMuscleNames(exercise.primaryMuscles).join(', ')
	const secondary = getFriendlyMuscleNames(exercise.secondaryMuscles).join(', ')
	const movement = [
		exercise.movementPattern
			? MOVEMENT_PATTERN_LABELS[exercise.movementPattern]
			: null,
		exercise.mechanic ? MECHANIC_LABELS[exercise.mechanic] : null,
	]
		.filter(Boolean)
		.join(' · ')
	const equipment = exercise.equipmentRequired
		.map(item => EQUIPMENT_LABELS[item])
		.join(', ')

	return (
		<li className={`rule-row py-3 ${ROW_GRID} lg:items-baseline`}>
			<div className="min-w-0">
				<h3 className="type-panel text-foreground">{exercise.name}</h3>
				<p className="type-body-sm mt-0.5 text-ink-2">
					<span className="sr-only">Muscles: </span>
					{primary || 'Not classified'}
					{secondary ? (
						<span className="text-ink-3"> · also {secondary}</span>
					) : null}
				</p>
			</div>
			{/* One inline line below `lg`; `lg:contents` turns each part into its
			    own ledger column, and the middots drop out. */}
			<p className="type-body-sm mt-1 text-ink-3 lg:contents">
				<span className="lg:text-ink-2">
					<span className="sr-only">Movement: </span>
					{movement || 'Not classified'}
				</span>
				<span aria-hidden className="lg:hidden">
					{' · '}
				</span>
				<span className="lg:text-ink-2">
					<span className="sr-only">Equipment: </span>
					{equipment || 'Not listed'}
				</span>
				{lastTrainedAt ? (
					<>
						<span aria-hidden className="lg:hidden">
							{' · '}
						</span>
						<span className="lg:text-right">
							<span className="lg:sr-only">Last trained </span>
							<time
								dateTime={lastTrainedAt}
								className="type-data whitespace-nowrap text-ink-2"
							>
								{formatDate(lastTrainedAt)}
							</time>
						</span>
					</>
				) : (
					<span className="hidden text-right lg:block">
						{historyKnown ? (
							<>
								<span aria-hidden>—</span>
								<span className="sr-only">Not trained yet</span>
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
	const catalog = useExercises()
	const trained = useTrainedExercises()
	const locations = useTrainingLocations()

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
		() => catalogFilterOptions(exercises, filters),
		[exercises, filters],
	)
	const results = useMemo(
		() => filterCatalog(exercises, filters, { trainedIds, listedEquipment }),
		[exercises, filters, listedEquipment, trainedIds],
	)
	const hasActiveFilters = hasActiveCatalogFilters(filters)
	const usesGym = filters.equipment === GYM_EQUIPMENT_FILTER

	let body: ReactNode
	let showCount = false
	if (catalog.isPending) {
		body = <RowsSkeleton label="Loading exercises" />
	} else if (catalog.isError) {
		body = (
			<RetryAlert
				title="The catalog is unavailable"
				description="We could not load the exercise catalog. Try again."
				onRetry={() => void catalog.refetch()}
			/>
		)
	} else if (filters.trained && trained.isPending) {
		body = <RowsSkeleton label="Loading your training history" />
	} else if (filters.trained && trained.isError) {
		body = (
			<RetryAlert
				title="Your training history is unavailable"
				description="We could not check which exercises you have trained. Try again, or turn off Trained by me."
				onRetry={() => void trained.refetch()}
			/>
		)
	} else if (usesGym && locations.isPending) {
		body = <RowsSkeleton label="Loading your training locations" />
	} else if (usesGym && locations.isError) {
		body = (
			<RetryAlert
				title="Your training locations are unavailable"
				description="We could not read the equipment listed at your gym. Try again."
				onRetry={() => void locations.refetch()}
			/>
		)
	} else if (usesGym && !listedEquipment) {
		body = <EmptyModule {...getGymFilterUnavailableState(gym?.name ?? null)} />
	} else if (results.length === 0) {
		showCount = exercises.length > 0
		body = (
			<EmptyModule
				{...getCatalogEmptyState({
					catalogSize: exercises.length,
					filters,
					hasTrainedExercises: trainedIds ? trainedIds.size > 0 : null,
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
					<span>Exercise</span>
					<span>Movement</span>
					<span>Equipment</span>
					<span className="text-right">Last trained</span>
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
			<section aria-label="Filter exercises" className="space-y-3">
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div className="flex min-w-0 flex-col gap-1">
						<Label htmlFor="exercise-search">Search</Label>
						<div className="relative">
							<Search
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
								aria-hidden
							/>
							<Input
								id="exercise-search"
								type="search"
								autoComplete="off"
								placeholder="Exercise name"
								className="pl-9"
								value={filters.q}
								onChange={event => setQuery(event.target.value)}
							/>
						</div>
					</div>
					<FilterSelect<MuscleGroup>
						id="exercise-muscle"
						label="Muscle"
						anyLabel="Any muscle"
						value={filters.muscle}
						options={options.muscles}
						disabled={!catalog.data}
						onChange={muscle => update({ muscle })}
					/>
					<FilterSelect<CatalogEquipmentFilter>
						id="exercise-equipment"
						label="Equipment"
						anyLabel="Any equipment"
						value={filters.equipment}
						options={options.equipment}
						disabled={!catalog.data}
						onChange={equipment => update({ equipment })}
					>
						{listedEquipment || usesGym ? (
							<option value={GYM_EQUIPMENT_FILTER}>
								{gym ? `Listed at ${gym.name}` : 'Listed at your gym'}
							</option>
						) : null}
					</FilterSelect>
					<FilterSelect<MovementPattern>
						id="exercise-pattern"
						label="Movement"
						anyLabel="Any movement"
						value={filters.pattern}
						options={options.patterns}
						disabled={!catalog.data}
						onChange={pattern => update({ pattern })}
					/>
				</div>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<Button
						type="button"
						size="sm"
						variant={filters.trained ? 'secondary' : 'outline'}
						aria-pressed={filters.trained}
						onClick={() => update({ trained: !filters.trained })}
					>
						{filters.trained ? (
							<Check className="size-4" aria-hidden />
						) : (
							<History className="size-4" aria-hidden />
						)}
						Trained by me
					</Button>
					{trained.isError && !filters.trained ? (
						<p className="type-body-sm text-ink-3">
							Training history is unavailable.{' '}
							<button
								type="button"
								className="text-primary underline-offset-4 hover:underline"
								onClick={() => void trained.refetch()}
							>
								Retry
							</button>
						</p>
					) : null}
					{hasActiveFilters ? (
						<Button type="button" size="sm" variant="ghost" onClick={clear}>
							<X className="size-4" aria-hidden />
							Clear filters
						</Button>
					) : null}
				</div>
			</section>

			<section aria-labelledby="exercise-catalog-heading">
				<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-2">
					<h2
						id="exercise-catalog-heading"
						className="type-section text-foreground"
					>
						Catalog
					</h2>
					<p role="status" className="type-body-sm text-ink-3">
						{showCount
							? formatCatalogCount(results.length, exercises.length)
							: null}
					</p>
				</div>
				{body}
			</section>
		</>
	)
}
