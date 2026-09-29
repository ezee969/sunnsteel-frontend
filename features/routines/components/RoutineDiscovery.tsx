'use client'

import type {
	MuscleGroup,
	RoutineDiscoveryQuery,
	RoutineDurationBand,
	TrainingExperienceLevel,
	TrainingGoal,
} from '@sunsteel/contracts'
import {
	MUSCLE_GROUPS,
	ROUTINE_DAYS_MAX,
	TRAINING_EXPERIENCE_LEVEL_VALUES,
	TRAINING_GOAL_VALUES,
} from '@sunsteel/contracts'
import { Compass, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useRoutineDiscovery } from '@/lib/api/hooks/useRoutineDiscovery'
import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'
import {
	describeClassification,
	describeDiscoveredAuthor,
	describeDiscoveredRoutine,
	discoveryScopeNote,
	discoveryTruncatedNote,
	durationBandOptions,
	durationEstimateNote,
	hasActiveFilters,
} from '@/lib/utils/routine-discovery'
import { profileRoutineHref } from '@/lib/utils/routine-sharing'
import {
	getTrainingExperienceLabel,
	getTrainingGoalLabel,
} from '@/lib/utils/training-identity'

const ANY = ''

/**
 * ROUT-07. Browsing programmes other members shared.
 *
 * The page states its own scope once: it lists what the viewer could already
 * have opened from a profile, so browsing is not a new way to see private
 * routines. Every duration is labelled an estimate, because it is computed
 * from the prescription by `ROUT-10`'s rule rather than measured.
 */
export function RoutineDiscovery() {
	const t = useTranslations('routines.discovery')
	const tIdentity = useTranslations('routines.identity')
	const tMuscles = useTranslations('routines.muscles')
	const [filters, setFilters] = useState<RoutineDiscoveryQuery>({})
	const query = useRoutineDiscovery(filters)

	const routines = useMemo(
		() => query.data?.pages.flatMap(page => page.routines) ?? [],
		[query.data],
	)
	const truncated = query.data?.pages.some(page => page.scanTruncated) ?? false
	const narrowed = hasActiveFilters(filters)

	const set = <K extends keyof RoutineDiscoveryQuery>(
		key: K,
		value: RoutineDiscoveryQuery[K],
	) => setFilters(current => ({ ...current, [key]: value }))

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<h1 className="type-section flex items-center gap-2 text-foreground">
					<Compass className="size-5 text-ink-3" aria-hidden /> {t('title')}
				</h1>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{discoveryScopeNote(t)}
				</p>
			</header>

			<section aria-label={t('filtersLabel')} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="discover-search">{t('searchLabel')}</Label>
					<Input
						id="discover-search"
						value={filters.q ?? ''}
						placeholder={t('searchPlaceholder')}
						onChange={event => set('q', event.target.value || undefined)}
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="space-y-2">
						<Label htmlFor="discover-goal">{t('goalLabel')}</Label>
						<NativeSelect
							id="discover-goal"
							value={filters.goal ?? ANY}
							onChange={event =>
								set('goal', (event.target.value || undefined) as TrainingGoal)
							}
						>
							<option value={ANY}>{t('anyGoal')}</option>
							{TRAINING_GOAL_VALUES.map(value => (
								<option key={value} value={value}>
									{getTrainingGoalLabel(value, tIdentity)}
								</option>
							))}
						</NativeSelect>
					</div>

					<div className="space-y-2">
						<Label htmlFor="discover-experience">{t('experienceLabel')}</Label>
						<NativeSelect
							id="discover-experience"
							value={filters.experienceLevel ?? ANY}
							onChange={event =>
								set(
									'experienceLevel',
									(event.target.value || undefined) as TrainingExperienceLevel,
								)
							}
						>
							<option value={ANY}>{t('anyExperience')}</option>
							{TRAINING_EXPERIENCE_LEVEL_VALUES.map(value => (
								<option key={value} value={value}>
									{getTrainingExperienceLabel(value, tIdentity)}
								</option>
							))}
						</NativeSelect>
					</div>

					<div className="space-y-2">
						<Label htmlFor="discover-days">{t('daysLabel')}</Label>
						<NativeSelect
							id="discover-days"
							value={filters.days ?? ANY}
							onChange={event =>
								set(
									'days',
									event.target.value ? Number(event.target.value) : undefined,
								)
							}
						>
							<option value={ANY}>{t('anyDays')}</option>
							{Array.from({ length: ROUTINE_DAYS_MAX }, (_, i) => i + 1).map(
								value => (
									<option key={value} value={value}>
										{t('daysOption', { days: value })}
									</option>
								),
							)}
						</NativeSelect>
					</div>

					<div className="space-y-2">
						<Label htmlFor="discover-muscle">{t('trainsLabel')}</Label>
						<NativeSelect
							id="discover-muscle"
							value={filters.muscle ?? ANY}
							onChange={event =>
								set('muscle', (event.target.value || undefined) as MuscleGroup)
							}
						>
							<option value={ANY}>{t('anyMuscle')}</option>
							{MUSCLE_GROUPS.map(value => (
								<option key={value} value={value}>
									{getFriendlyMuscleName(value, tMuscles)}
								</option>
							))}
						</NativeSelect>
					</div>

					<div className="space-y-2">
						<Label htmlFor="discover-duration">{t('lengthLabel')}</Label>
						<NativeSelect
							id="discover-duration"
							value={filters.duration ?? ANY}
							onChange={event =>
								set(
									'duration',
									(event.target.value || undefined) as RoutineDurationBand,
								)
							}
						>
							<option value={ANY}>{t('anyLength')}</option>
							{durationBandOptions(t).map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</NativeSelect>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{durationEstimateNote(t)}
					</p>
					{narrowed ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setFilters({})}
						>
							{t('clearFilters')}
						</Button>
					) : null}
				</div>
			</section>

			<section aria-label={t('resultsLabel')} className="space-y-4">
				{query.isLoading ? (
					<div className="space-y-3" aria-busy="true">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				) : query.error ? (
					<div
						role="alert"
						className="border border-destructive bg-surface p-4"
					>
						<p className="type-body-sm text-destructive">
							{query.error.message}
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => void query.refetch()}
						>
							{t('tryAgain')}
						</Button>
					</div>
				) : routines.length ? (
					<>
						{truncated ? (
							<p role="status" className="type-body-sm text-ink-2">
								{discoveryTruncatedNote(t)}
							</p>
						) : null}
						<ul className="border-t border-rule-faint">
							{routines.map(routine => {
								const claims = describeClassification(routine, tIdentity)
								return (
									<li
										key={routine.routineId}
										className="rule-row grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4"
									>
										<div className="min-w-0">
											<h2 className="type-panel text-foreground">
												<Link
													href={profileRoutineHref(
														routine.author.username,
														routine.routineId,
													)}
													className="underline-offset-4 hover:underline"
												>
													{routine.name}
												</Link>
											</h2>
											<p className="type-body-sm text-ink-3">
												{t('byAuthor', {
													author: describeDiscoveredAuthor(routine),
												})}
											</p>
											{routine.description ? (
												<p className="type-body-sm max-w-[68ch] text-ink-2">
													{routine.description}
												</p>
											) : null}
											{claims ? (
												<p className="type-body-sm text-ink-2">{claims}</p>
											) : null}
										</div>
										<span className="type-data whitespace-nowrap text-ink-3">
											{describeDiscoveredRoutine(routine, t)}
										</span>
									</li>
								)
							})}
						</ul>
						{query.hasNextPage ? (
							<Button
								type="button"
								variant="outline"
								onClick={() => void query.fetchNextPage()}
								disabled={query.isFetchingNextPage}
							>
								{query.isFetchingNextPage ? (
									<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
								) : null}
								{t('showMore')}
							</Button>
						) : null}
					</>
				) : (
					<p className="type-body-sm py-4 text-ink-3">
						{narrowed ? t('emptyFiltered') : t('emptyAll')}
					</p>
				)}
			</section>
		</div>
	)
}
