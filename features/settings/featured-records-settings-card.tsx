'use client'

import {
	type EarnedAchievement,
	FEATURED_PROFILE_ITEMS_MAX,
	type FeaturedProfileSelection,
	type PersonalRecordEntry,
	type ProfileVisibility,
	type RenaissanceRankDefinition,
	type Routine,
	type WeightUnit,
} from '@sunsteel/contracts'
import {
	ArrowDown,
	ArrowUp,
	Award,
	Bookmark,
	Dumbbell,
	Loader2,
	Medal,
	Plus,
	Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useAchievements } from '@/lib/api/hooks/useAchievements'
import {
	useFeaturedProfileItems,
	useReplaceFeaturedProfileItems,
} from '@/lib/api/hooks/useFeaturedProfileItems'
import { usePublicUser } from '@/lib/api/hooks/usePublicUser'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { formatAchievementDate } from '@/lib/utils/achievements'
import {
	addFeaturedProfileItem,
	buildFeaturedProfileRequest,
	featuredProfileSelectionKey,
	moveFeaturedProfileItem,
	reachedRenaissanceRanks,
	removeFeaturedProfileItem,
} from '@/lib/utils/featured-profile-items'
import {
	describeNoFeaturableRoutines,
	describeVisibilityCap,
	effectiveRoutineVisibility,
} from '@/lib/utils/routine-sharing'
import { formatWeight } from '@/lib/utils/weight-unit'

interface FeaturedRecordsSettingsCardProps {
	username: string
	weightUnit: WeightUnit
	/** PROF-06's routines rule, which caps every routine offered below. */
	accountRoutinesRule: ProfileVisibility
}

const EMPTY_RECORDS: PersonalRecordEntry[] = []
const EMPTY_ACHIEVEMENTS: EarnedAchievement[] = []
const EMPTY_ROUTINES: Routine[] = []

/** One routine's days and exercises, for a row nobody has opened yet. */
function routineSummary(routine: Routine) {
	const days = routine.days?.length ?? 0
	const exercises = (routine.days ?? []).reduce(
		(total, day) => total + (day.exercises?.length ?? 0),
		0,
	)
	return `${days} ${days === 1 ? 'day' : 'days'} · ${exercises} ${
		exercises === 1 ? 'exercise' : 'exercises'
	} · ${routine.scheduleMode === 'ROTATION' ? 'Rotation' : 'Weekly'}`
}

function recordSummary(record: PersonalRecordEntry, weightUnit: WeightUnit) {
	return `${formatWeight(record.weight, weightUnit)} × ${record.reps} · est. 1RM ${formatWeight(record.estimated1rm, weightUnit)}`
}

function achievementSummary(achievement: EarnedAchievement) {
	return achievement.backfilled
		? 'Recognized from history'
		: `Earned ${formatAchievementDate(achievement.unlockedAt)}`
}

function selectedItemPresentation(
	item: FeaturedProfileSelection,
	recordsById: Map<string, PersonalRecordEntry>,
	achievementsById: Map<string, EarnedAchievement>,
	ranksById: Map<string, RenaissanceRankDefinition>,
	routinesById: Map<string, Routine>,
	weightUnit: WeightUnit,
) {
	if (item.kind === 'RECORD') {
		const record = recordsById.get(item.referenceId)
		return {
			kindLabel: 'Personal record',
			title: record?.exerciseName ?? 'Record no longer available',
			detail: record
				? recordSummary(record, weightUnit)
				: 'Remove this stale reference before saving.',
		}
	}
	if (item.kind === 'ACHIEVEMENT') {
		const achievement = achievementsById.get(item.referenceId)
		return {
			kindLabel: 'Achievement',
			title: achievement?.title ?? 'Achievement no longer available',
			detail: achievement
				? achievementSummary(achievement)
				: 'Remove this stale reference before saving.',
		}
	}
	if (item.kind === 'ROUTINE') {
		const routine = routinesById.get(item.referenceId)
		return {
			kindLabel: 'Routine',
			title: routine?.name ?? 'Routine no longer shareable',
			detail: routine
				? routineSummary(routine)
				: 'Remove this stale reference before saving.',
		}
	}
	const rank = ranksById.get(item.referenceId)
	return {
		kindLabel: 'Renaissance rank',
		title: rank?.title ?? 'Rank no longer available',
		detail: rank?.description ?? 'Remove this stale reference before saving.',
	}
}

export function FeaturedRecordsSettingsCard({
	username,
	weightUnit,
	accountRoutinesRule,
}: FeaturedRecordsSettingsCardProps) {
	const selectionsQuery = useFeaturedProfileItems()
	const profileQuery = usePublicUser(username)
	const achievementsQuery = useAchievements()
	const routinesQuery = useRoutines()
	const replaceItems = useReplaceFeaturedProfileItems()
	const { push } = useToast()
	const [drafts, setDrafts] = useState<FeaturedProfileSelection[]>([])

	useEffect(() => {
		if (selectionsQuery.data) setDrafts(selectionsQuery.data.items)
	}, [selectionsQuery.data])

	const records = profileQuery.data?.personalRecords ?? EMPTY_RECORDS
	const achievements =
		achievementsQuery.data?.achievements ?? EMPTY_ACHIEVEMENTS
	const routines = routinesQuery.data ?? EMPTY_ROUTINES
	/**
	 * PROF-08/ROUT-04: only routines somebody else could actually reach are
	 * offered. Featuring one nobody can open would show the owner a slot that
	 * never renders, and the account rule caps every routine's own setting.
	 */
	const shareableRoutines = useMemo(
		() =>
			routines.filter(
				routine =>
					effectiveRoutineVisibility(
						accountRoutinesRule,
						routine.visibility,
					) !== 'PRIVATE',
			),
		[routines, accountRoutinesRule],
	)
	const reachedRanks = useMemo(
		() => reachedRenaissanceRanks(achievementsQuery.data?.rank?.currentRank.id),
		[achievementsQuery.data?.rank?.currentRank.id],
	)
	const recordsById = useMemo(
		() => new Map(records.map(record => [record.exerciseId, record])),
		[records],
	)
	const achievementsById = useMemo(
		() =>
			new Map(achievements.map(achievement => [achievement.id, achievement])),
		[achievements],
	)
	const ranksById = useMemo(
		() => new Map(reachedRanks.map(rank => [rank.id, rank])),
		[reachedRanks],
	)
	const routinesById = useMemo(
		() => new Map(shareableRoutines.map(routine => [routine.id, routine])),
		[shareableRoutines],
	)
	const selectedKeys = useMemo(
		() => new Set(drafts.map(featuredProfileSelectionKey)),
		[drafts],
	)
	const availableRecords = records.filter(
		record => !selectedKeys.has(`RECORD:${record.exerciseId}`),
	)
	const availableAchievements = achievements.filter(
		achievement => !selectedKeys.has(`ACHIEVEMENT:${achievement.id}`),
	)
	const availableRanks = reachedRanks.filter(
		rank => !selectedKeys.has(`RANK:${rank.id}`),
	)
	const availableRoutines = shareableRoutines.filter(
		routine => !selectedKeys.has(`ROUTINE:${routine.id}`),
	)
	const hasSelectedRank = drafts.some(item => item.kind === 'RANK')
	const slotsFull = drafts.length >= FEATURED_PROFILE_ITEMS_MAX
	const savedKeys =
		selectionsQuery.data?.items.map(featuredProfileSelectionKey).join('|') ?? ''
	const draftKeys = drafts.map(featuredProfileSelectionKey).join('|')
	const hasChanges = savedKeys !== draftKeys
	const isLoading =
		selectionsQuery.isLoading ||
		profileQuery.isLoading ||
		achievementsQuery.isLoading ||
		routinesQuery.isLoading
	const error =
		selectionsQuery.error ??
		profileQuery.error ??
		achievementsQuery.error ??
		routinesQuery.error

	const save = () => {
		replaceItems.mutate(buildFeaturedProfileRequest(drafts), {
			onSuccess: () => {
				push({
					title: 'Featured accomplishments saved',
					description: 'Your profile now uses this accomplishment order.',
					variant: 'success',
				})
			},
			onError: mutationError => {
				push({
					title: 'Could not save featured accomplishments',
					description: mutationError.message,
					variant: 'destructive',
				})
			},
		})
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Bookmark className="size-5 text-ink-3" aria-hidden />
					<CardTitle>Featured Accomplishments</CardTitle>
				</div>
				<CardDescription>
					Choose and order up to {FEATURED_PROFILE_ITEMS_MAX} current records,
					earned medals, shared routines, and one reached rank title. Records
					follow your Personal Records privacy setting; medals and rank follow
					Achievements; each routine follows its own sharing setting under your
					Routines privacy.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				{isLoading ? (
					<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Loading featured accomplishments…
					</div>
				) : error ? (
					<div
						role="alert"
						className="border border-destructive bg-surface p-4"
					>
						<p className="type-body-sm text-destructive">{error.message}</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => {
								void selectionsQuery.refetch()
								void profileQuery.refetch()
								void achievementsQuery.refetch()
								void routinesQuery.refetch()
							}}
						>
							Try Again
						</Button>
					</div>
				) : (
					<>
						<div>
							<p className="type-label border-b border-rule pb-2 text-ink-3">
								Profile order
							</p>
							{drafts.length ? (
								<div>
									{drafts.map((item, index) => {
										const presentation = selectedItemPresentation(
											item,
											recordsById,
											achievementsById,
											ranksById,
											routinesById,
											weightUnit,
										)
										return (
											<div
												key={featuredProfileSelectionKey(item)}
												className="rule-row grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
											>
												<div className="min-w-0">
													<p className="type-body-sm text-ink-3">
														{presentation.kindLabel}
													</p>
													<p className="type-panel text-foreground">
														{presentation.title}
													</p>
													<p className="type-body-sm text-ink-3">
														{presentation.detail}
													</p>
												</div>
												<div className="flex items-center gap-1">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={`Move ${presentation.title} up`}
														disabled={index === 0}
														onClick={() =>
															setDrafts(current =>
																moveFeaturedProfileItem(
																	current,
																	index,
																	index - 1,
																),
															)
														}
													>
														<ArrowUp className="size-4" aria-hidden />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={`Move ${presentation.title} down`}
														disabled={index === drafts.length - 1}
														onClick={() =>
															setDrafts(current =>
																moveFeaturedProfileItem(
																	current,
																	index,
																	index + 1,
																),
															)
														}
													>
														<ArrowDown className="size-4" aria-hidden />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={`Remove ${presentation.title}`}
														onClick={() =>
															setDrafts(current =>
																removeFeaturedProfileItem(
																	current,
																	featuredProfileSelectionKey(item),
																),
															)
														}
													>
														<Trash2
															className="size-4 text-destructive"
															aria-hidden
														/>
													</Button>
												</div>
											</div>
										)
									})}
								</div>
							) : (
								<p className="type-body-sm py-4 text-ink-3">
									No featured accomplishments yet.
								</p>
							)}
						</div>

						{availableRecords.length ? (
							<div>
								<p className="type-label border-b border-rule pb-2 text-ink-3">
									Available records
								</p>
								{availableRecords.map(record => (
									<div
										key={record.exerciseId}
										className="rule-row flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<p className="type-panel text-foreground">
												{record.exerciseName}
											</p>
											<p className="type-body-sm text-ink-3">
												{recordSummary(record, weightUnit)}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											aria-label={`Feature ${record.exerciseName}`}
											disabled={slotsFull}
											onClick={() =>
												setDrafts(current =>
													addFeaturedProfileItem(
														current,
														'RECORD',
														record.exerciseId,
													),
												)
											}
										>
											<Plus className="size-4" aria-hidden /> Feature
										</Button>
									</div>
								))}
							</div>
						) : records.length === 0 ? (
							<p className="type-body-sm text-ink-3">
								Complete logged sets to establish records you can feature.
							</p>
						) : null}

						<div>
							<div className="flex items-center gap-2 border-b border-rule pb-2">
								<Medal className="size-4 text-ink-3" aria-hidden />
								<p className="type-label text-ink-3">Earned medals</p>
							</div>
							{availableAchievements.length ? (
								availableAchievements.map(achievement => (
									<div
										key={achievement.id}
										className="rule-row flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="min-w-0">
											<p className="type-panel text-foreground">
												{achievement.title}
											</p>
											<p className="type-body-sm text-ink-2">
												{achievement.description}
											</p>
											<p className="type-body-sm text-ink-3">
												{achievementSummary(achievement)}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											aria-label={`Feature ${achievement.title}`}
											disabled={slotsFull}
											onClick={() =>
												setDrafts(current =>
													addFeaturedProfileItem(
														current,
														'ACHIEVEMENT',
														achievement.id,
													),
												)
											}
										>
											<Plus className="size-4" aria-hidden /> Feature
										</Button>
									</div>
								))
							) : achievementsQuery.data?.analyticsReady ? (
								<p className="type-body-sm py-4 text-ink-3">
									{achievements.length
										? 'Every earned medal is already featured.'
										: 'Complete workouts to earn verified medals you can feature.'}
								</p>
							) : (
								<p className="type-body-sm py-4 text-ink-3">
									Training history is preparing. Medals will appear when your
									progress data is ready.
								</p>
							)}
						</div>

						<div>
							<div className="flex items-center gap-2 border-b border-rule pb-2">
								<Dumbbell className="size-4 text-ink-3" aria-hidden />
								<p className="type-label text-ink-3">Shared routines</p>
							</div>
							{availableRoutines.length ? (
								availableRoutines.map(routine => {
									const cap = describeVisibilityCap(
										accountRoutinesRule,
										routine.visibility,
									)
									return (
										<div
											key={routine.id}
											className="rule-row flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
										>
											<div className="min-w-0">
												<p className="type-panel text-foreground">
													{routine.name}
												</p>
												<p className="type-body-sm text-ink-3">
													{routineSummary(routine)}
												</p>
												{cap ? (
													<p className="type-body-sm text-ink-3">{cap}</p>
												) : null}
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												aria-label={`Feature ${routine.name}`}
												disabled={slotsFull}
												onClick={() =>
													setDrafts(current =>
														addFeaturedProfileItem(
															current,
															'ROUTINE',
															routine.id,
														),
													)
												}
											>
												<Plus className="size-4" aria-hidden /> Feature
											</Button>
										</div>
									)
								})
							) : (
								<p className="type-body-sm py-4 text-ink-3">
									{describeNoFeaturableRoutines(accountRoutinesRule, {
										routines: routines.length,
										shareable: shareableRoutines.length,
									})}
								</p>
							)}
						</div>

						<div>
							<div className="flex items-center gap-2 border-b border-rule pb-2">
								<Award className="size-4 text-ink-3" aria-hidden />
								<p className="type-label text-ink-3">Reached ranks</p>
							</div>
							{availableRanks.length ? (
								availableRanks.map(rank => (
									<div
										key={rank.id}
										className="rule-row flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="min-w-0">
											<p className="type-panel text-foreground">{rank.title}</p>
											<p className="type-body-sm text-ink-2">
												{rank.description}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											aria-label={`Feature ${rank.title} rank`}
											disabled={slotsFull || hasSelectedRank}
											onClick={() =>
												setDrafts(current =>
													addFeaturedProfileItem(current, 'RANK', rank.id),
												)
											}
										>
											<Plus className="size-4" aria-hidden /> Feature rank
										</Button>
									</div>
								))
							) : (
								<p className="type-body-sm py-4 text-ink-3">
									{hasSelectedRank
										? 'Your reached rank title is already featured.'
										: 'Ranks will appear when your progress data is ready.'}
								</p>
							)}
							{hasSelectedRank && availableRanks.length ? (
								<p className="type-body-sm pt-2 text-ink-3">
									Remove the featured rank before choosing another title.
								</p>
							) : null}
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
							<p className="type-body-sm text-ink-3">
								{drafts.length}/{FEATURED_PROFILE_ITEMS_MAX} slots used
							</p>
							<Button
								type="button"
								onClick={save}
								disabled={!hasChanges || replaceItems.isPending}
							>
								{replaceItems.isPending ? (
									<Loader2 className="size-4 animate-spin" aria-hidden />
								) : null}
								Save Featured Items
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
