'use client'

import {
	PublicUserProfile,
	UserProfile,
	WeightUnit,
	WorkoutProgressResponse,
	WorkoutStatsResponse,
} from '@sunsteel/contracts'
import { formatDistanceToNow } from 'date-fns'
import {
	Activity,
	CalendarDays,
	Dumbbell,
	Flame,
	MapPin,
	Share2,
	Target,
	Trophy,
	UserMinus,
	UserPlus,
} from 'lucide-react'
import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatTimeAgo } from '@/lib/utils/date'
import {
	copyTextToClipboard,
	getSharedProfileUrl,
} from '@/lib/utils/profile-sharing'
import {
	getPreferredTrainingStyleLabel,
	getTrainingDisciplineLabel,
	getTrainingExperienceLabel,
	getTrainingGoalLabel,
	hasTrainingIdentity,
} from '@/lib/utils/training-identity'
import {
	formatWeight,
	formatWeightAmount,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

type ProfileViewProps =
	| {
			variant: 'owner'
			profile: UserProfile
			progress?: WorkoutProgressResponse
			stats?: WorkoutStatsResponse
			weightUnit: WeightUnit
	  }
	| {
			variant: 'member'
			profile: PublicUserProfile
			weightUnit: WeightUnit
			isMutating?: boolean
			onFollowToggle?: () => void
	  }

export function ProfileView(props: ProfileViewProps) {
	const { push } = useToast()
	const isOwnProfile = props.variant === 'owner'
	const profile = props.profile
	const ownerProfile = props.variant === 'owner' ? props.profile : undefined
	const publicUser = props.variant === 'member' ? props.profile : undefined
	const progress = props.variant === 'owner' ? props.progress : undefined
	const stats = props.variant === 'owner' ? props.stats : undefined
	const followAction =
		props.variant === 'member' ? props.onFollowToggle : undefined
	const profileName = profile.name
	const profileUsername = profile.username
	const profileLastName = profile.lastName
	const profileAvatar = profile.avatarUrl
	const profileCreatedAt = profile.createdAt
	const followerCount = profile.followerCount
	const followingCount = profile.followingCount
	const isFollowedByMe = publicUser?.isFollowedByMe ?? false
	const joinDateText = formatDistanceToNow(new Date(profileCreatedAt), {
		addSuffix: true,
	})

	const canViewWorkoutHistory =
		isOwnProfile || publicUser!.viewerAccess.workoutHistory
	const publicTrainingSummary = isOwnProfile
		? undefined
		: publicUser!.trainingSummary
	const totalWorkouts = isOwnProfile
		? (stats?.totalCompleted ?? 0)
		: (publicTrainingSummary?.completedWorkouts ?? 0)
	const weeklyWorkouts = stats?.weeklyWorkoutsCount ?? 0
	const currentStreak = isOwnProfile
		? (progress?.currentStreakDays ?? 0)
		: (publicTrainingSummary?.currentStreakDays ?? 0)
	const bestStreak = isOwnProfile
		? (progress?.bestStreakDays ?? 0)
		: (publicTrainingSummary?.bestStreakDays ?? 0)
	const totalVolumeKg = isOwnProfile
		? (progress?.totalVolumeKg ?? 0)
		: (publicTrainingSummary?.totalVolumeKg ?? 0)
	const weightUnit = props.weightUnit
	const totalVolume = kilogramsToDisplayWeight(totalVolumeKg, weightUnit)
	const canViewRecords = isOwnProfile || publicUser!.viewerAccess.records
	const personalRecords = isOwnProfile
		? (progress?.personalRecords ?? [])
		: (publicUser!.personalRecords ?? [])
	const canViewBodyMetrics =
		isOwnProfile || publicUser!.viewerAccess.bodyMetrics
	const canViewBiography = isOwnProfile || publicUser!.viewerAccess.biography
	const biography = isOwnProfile ? ownerProfile!.bio : publicUser!.bio
	const canViewLocation = isOwnProfile || publicUser!.viewerAccess.location
	const location = isOwnProfile ? ownerProfile!.location : publicUser!.location
	const canViewTrainingIdentity =
		isOwnProfile || publicUser!.viewerAccess.trainingIdentity
	const trainingIdentity = isOwnProfile
		? ownerProfile!.trainingIdentity
		: publicUser!.trainingIdentity
	const hasTrainingIdentityContent = hasTrainingIdentity(trainingIdentity)
	const bodyMetrics = isOwnProfile
		? {
				age: ownerProfile!.age,
				sex: ownerProfile!.sex,
				weightKg: ownerProfile!.weight,
				heightCm: ownerProfile!.height,
			}
		: publicUser!.bodyMetrics
	const hasBodyMetrics = Boolean(
		bodyMetrics &&
		(bodyMetrics.age != null ||
			bodyMetrics.sex != null ||
			bodyMetrics.weightKg != null ||
			bodyMetrics.heightCm != null),
	)
	const volumeLabel =
		totalVolume >= 1_000_000
			? `${(totalVolume / 1_000_000).toFixed(1)}M`
			: totalVolume >= 1_000
				? `${(totalVolume / 1_000).toFixed(1)}k`
				: formatWeightAmount(totalVolumeKg, weightUnit, 1)
	const isMutating = props.variant === 'member' && props.isMutating

	const onFollowToggle = () => {
		followAction?.()
	}

	const onShareProfile = async () => {
		try {
			const url = getSharedProfileUrl(profileUsername, window.location.origin)
			await copyTextToClipboard(url)
			push({
				title: 'Profile link copied',
				description: 'Anyone with the link can view this public profile.',
				variant: 'success',
			})
		} catch {
			push({
				title: 'Could not copy profile link',
				description: 'Check your browser permissions and try again.',
				variant: 'destructive',
			})
		}
	}

	return (
		<div className="mx-auto w-full max-w-5xl space-y-8 pb-20 sm:space-y-12">
			{/* Final review 7: the gradient band, the third-party "stardust"
			    texture (a request to transparenttextures.com on every view), the
			    blurred halo and the card around the whole masthead are gone. The
			    profile opens like every other page - an inscription over the double
			    rule (§11.11) - with the portrait at a measured size, which also
			    gives the first 390px viewport back to content. */}
			<section className="rule-heading pb-6">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-end">
					<Avatar className="h-20 w-20 shrink-0 border border-rule sm:h-24 sm:w-24">
						<AvatarImage
							src={profileAvatar || ''}
							alt={profileName}
							className="object-cover"
						/>
						<AvatarFallback className="type-numeral bg-surface-sunk text-ink-2">
							{profileName.charAt(0)}
							{profileLastName?.charAt(0)}
						</AvatarFallback>
					</Avatar>

					<div className="min-w-0 flex-1 space-y-1">
						{/* FIX-02: nothing on UserProfile or PublicUserProfile carries a
							membership, plan or tier, so no badge rendered here can be backed by
							real account state. Titles and ranks are owned by ACH-02/ACH-03; do
							not re-add one ad hoc. */}
						<h1 className="type-page corner-brackets inline-block text-foreground">
							{profileName} {profileLastName}
						</h1>
						<p className="type-data text-ink-3">@{profileUsername}</p>
						<p className="type-body-sm flex items-center gap-1.5 text-ink-3">
							<CalendarDays className="h-4 w-4" aria-hidden /> Joined{' '}
							{joinDateText}
						</p>

						{/* FIX-06: these counts are text, not controls. They used to carry
							cursor-pointer and a hover state while leading nowhere. The browsable
							follower/following lists, and the paginated endpoint they need, belong
							to SOC-02. */}
						<div className="flex gap-5 pt-2">
							<p className="flex items-baseline gap-1.5">
								<span className="type-data type-data-strong text-foreground">
									{followerCount}
								</span>
								<span className="type-body-sm text-ink-3">Followers</span>
							</p>
							<p className="flex items-baseline gap-1.5">
								<span className="type-data type-data-strong text-foreground">
									{followingCount}
								</span>
								<span className="type-body-sm text-ink-3">Following</span>
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button variant="outline" size="sm" onClick={onShareProfile}>
							<Share2 className="mr-2 h-4 w-4" aria-hidden /> Share Profile
						</Button>
						{!isOwnProfile && followAction && (
							<Button
								variant={isFollowedByMe ? 'outline' : 'default'}
								size="sm"
								onClick={onFollowToggle}
								disabled={isMutating}
							>
								{isFollowedByMe ? (
									<>
										<UserMinus className="mr-2 h-4 w-4" aria-hidden />
										{isMutating ? 'Unfollowing...' : 'Unfollow'}
									</>
								) : (
									<>
										<UserPlus className="mr-2 h-4 w-4" aria-hidden />
										{isMutating ? 'Following...' : 'Follow'}
									</>
								)}
							</Button>
						)}
					</div>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
				<div className="space-y-8 lg:col-span-1 lg:border-r lg:border-rule-faint lg:pr-8">
					<section className="space-y-3">
						<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
							<User className="h-4 w-4 text-ink-3" aria-hidden /> About
						</h2>
						<p className="type-body-sm whitespace-pre-line text-ink-2">
							{!canViewBiography
								? 'Biography is private.'
								: biography || 'No bio yet.'}
						</p>
						<div className="type-body-sm flex items-start gap-2 text-ink-2">
							<MapPin
								className="mt-0.5 h-4 w-4 shrink-0 text-ink-3"
								aria-hidden
							/>
							<span>
								{!canViewLocation
									? 'Location is private.'
									: location || 'No location added yet.'}
							</span>
						</div>
					</section>

					<section className="space-y-3">
						<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
							<Target className="h-4 w-4 text-ink-3" aria-hidden />
							Training Identity
						</h2>
						{!canViewTrainingIdentity ? (
							<p className="type-body-sm text-ink-3">
								Training identity is private.
							</p>
						) : !hasTrainingIdentityContent || !trainingIdentity ? (
							<p className="type-body-sm text-ink-3">
								No training identity added yet.
							</p>
						) : (
							<dl className="type-body-sm space-y-4 text-foreground">
								{trainingIdentity.goals.length > 0 ? (
									<div className="space-y-2">
										<dt className="type-label text-ink-3">Goals</dt>
										<dd className="flex flex-wrap gap-2">
											{trainingIdentity.goals.map(goal => (
												<Badge key={goal} variant="secondary">
													{getTrainingGoalLabel(goal)}
												</Badge>
											))}
										</dd>
									</div>
								) : null}
								{trainingIdentity.experienceLevel ? (
									<div className="space-y-1">
										<dt className="type-label text-ink-3">Experience</dt>
										<dd>
											{getTrainingExperienceLabel(
												trainingIdentity.experienceLevel,
											)}
										</dd>
									</div>
								) : null}
								{trainingIdentity.disciplines.length > 0 ? (
									<div className="space-y-2">
										<dt className="type-label text-ink-3">Disciplines</dt>
										<dd className="flex flex-wrap gap-2">
											{trainingIdentity.disciplines.map(discipline => (
												<Badge key={discipline} variant="outline">
													{getTrainingDisciplineLabel(discipline)}
												</Badge>
											))}
										</dd>
									</div>
								) : null}
								{trainingIdentity.preferredStyle ? (
									<div className="space-y-1">
										<dt className="type-label text-ink-3">Preferred style</dt>
										<dd>
											{getPreferredTrainingStyleLabel(
												trainingIdentity.preferredStyle,
											)}
										</dd>
									</div>
								) : null}
								{trainingIdentity.favoriteExercises.length > 0 ? (
									<div className="space-y-2">
										<dt className="type-label text-ink-3">
											Favorite exercises
										</dt>
										<dd>
											<ul className="space-y-1 text-ink-2">
												{trainingIdentity.favoriteExercises.map(exercise => (
													<li key={exercise.id}>{exercise.name}</li>
												))}
											</ul>
										</dd>
									</div>
								) : null}
							</dl>
						)}
					</section>

					<section className="space-y-3">
						<h2 className="type-section rule-heading pb-2 text-foreground">
							Body Metrics
						</h2>
						{!canViewBodyMetrics ? (
							<p className="type-body-sm text-ink-3">
								Body metrics are private.
							</p>
						) : !hasBodyMetrics ? (
							<p className="type-body-sm text-ink-3">
								No body metrics added yet.
							</p>
						) : (
							<dl className="grid grid-cols-2 gap-x-4 gap-y-3">
								<BodyMetric label="Age" value={bodyMetrics?.age} />
								<BodyMetric
									label="Sex"
									value={
										bodyMetrics?.sex ? bodyMetrics.sex.toLowerCase() : null
									}
									capitalize
								/>
								<BodyMetric
									label="Weight"
									value={
										bodyMetrics?.weightKg == null
											? null
											: formatWeight(bodyMetrics.weightKg, weightUnit)
									}
								/>
								<BodyMetric
									label="Height"
									value={
										bodyMetrics?.heightCm == null
											? null
											: `${bodyMetrics.heightCm} cm`
									}
								/>
							</dl>
						)}
					</section>
				</div>

				<div className="space-y-8 lg:col-span-2">
					{/* Final review 7: the three boxed stat cards with oversized
					    watermark icons and emerald/orange/blue trend colours become one
					    ruled band, the dashboard's pattern (§10.1). None of those
					    colours meant anything the palette defines. */}
					<div className="grid grid-cols-2 gap-px border-y border-rule bg-rule-faint sm:grid-cols-4">
						<div className="flex flex-col gap-2 bg-background px-3 py-4 sm:px-4">
							<div className="flex items-center gap-2 text-ink-3">
								<Dumbbell className="h-4 w-4 shrink-0" aria-hidden />
								<span className="type-label">Workouts</span>
							</div>
							<span className="type-numeral text-foreground">
								{canViewWorkoutHistory ? totalWorkouts : '—'}
							</span>
							<span className="type-body-sm text-ink-3">
								{canViewWorkoutHistory
									? isOwnProfile
										? `+${weeklyWorkouts} this week`
										: 'Lifetime completed'
									: ' '}
							</span>
						</div>

						<div className="flex flex-col gap-2 bg-background px-3 py-4 sm:px-4">
							<div className="flex items-center gap-2 text-ink-3">
								<Flame className="h-4 w-4 shrink-0" aria-hidden />
								<span className="type-label">Streak</span>
							</div>
							<div className="flex flex-wrap items-baseline gap-x-1.5">
								<span className="type-numeral text-foreground">
									{canViewWorkoutHistory ? currentStreak : '—'}
								</span>
								{canViewWorkoutHistory ? (
									<span className="type-data text-ink-3">days</span>
								) : null}
							</div>
							<span className="type-body-sm text-ink-3">
								{canViewWorkoutHistory ? `Personal Best: ${bestStreak}` : ' '}
							</span>
						</div>

						<div className="col-span-2 flex flex-col gap-2 bg-background px-3 py-4 sm:px-4">
							<div className="flex items-center gap-2 text-ink-3">
								<Activity className="h-4 w-4 shrink-0" aria-hidden />
								<span className="type-label">Volume Lifted Total</span>
							</div>
							<div className="flex flex-wrap items-baseline gap-x-1.5">
								<span className="type-numeral text-foreground">
									{canViewWorkoutHistory ? volumeLabel : '—'}
								</span>
								{canViewWorkoutHistory ? (
									<span className="type-data text-ink-3">
										{getWeightUnitLabel(weightUnit)}
									</span>
								) : null}
							</div>
						</div>
					</div>

					{/* §11.5: records are a ruled list, not a translucent panel of
					    hover-boxed rows. One honour mark for the section - records are
					    exactly what gold means, but at most two per viewport (§4.3
					    rule 3), matching the dashboard and the session recap. */}
					<section>
						<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
							<Trophy className="h-4 w-4 text-honour" aria-hidden /> Personal
							Records
						</h2>
						{!canViewRecords || personalRecords.length === 0 ? (
							<p className="type-body-sm py-3 text-ink-3">
								{!canViewRecords
									? 'Personal records are private.'
									: isOwnProfile
										? 'Log a few sets and your records will show up here.'
										: 'No personal records yet.'}
							</p>
						) : (
							<div className="pt-1">
								{personalRecords.map(record => (
									<div
										key={record.exerciseId}
										className="rule-row flex items-baseline justify-between gap-4 py-3"
									>
										<div className="min-w-0">
											<h3 className="type-panel text-foreground">
												{record.exerciseName}
											</h3>
											<p className="type-body-sm text-ink-3">
												<span className="type-data text-ink-2">
													{formatWeight(record.weight, weightUnit)}
												</span>{' '}
												for {record.reps} reps · est. 1RM{' '}
												<span className="type-data text-ink-2">
													{formatWeight(record.estimated1rm, weightUnit)}
												</span>
											</p>
										</div>
										<span className="type-body-sm shrink-0 whitespace-nowrap text-ink-3">
											{formatTimeAgo(record.achievedAt)}
										</span>
									</div>
								))}
							</div>
						)}
					</section>
				</div>
			</div>
		</div>
	)
}

function BodyMetric({
	label,
	value,
	capitalize = false,
}: {
	label: string
	value: string | number | null | undefined
	capitalize?: boolean
}) {
	return (
		<div>
			<dt className="type-label text-ink-3">{label}</dt>
			<dd
				className={
					capitalize
						? 'type-data capitalize text-foreground'
						: 'type-data text-foreground'
				}
			>
				{value ?? '—'}
			</dd>
		</div>
	)
}

function User(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	)
}
