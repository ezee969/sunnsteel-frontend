'use client'

import { formatDistanceToNow } from 'date-fns'
import {
	Activity,
	CalendarDays,
	Dumbbell,
	Flame,
	Share2,
	Trophy,
	UserMinus,
	UserPlus,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFollowUser } from '@/lib/api/hooks/useFollowUser'
import { usePublicUser } from '@/lib/api/hooks/usePublicUser'
import { useUnfollowUser } from '@/lib/api/hooks/useUnfollowUser'
import { useUser } from '@/lib/api/hooks/useUser'
import {
	useWorkoutProgress,
	useWorkoutStats,
} from '@/lib/api/hooks/useWorkoutSession'
import { formatTimeAgo } from '@/lib/utils/date'
import { normalizeUsername } from '@/lib/utils/username'
import {
	formatWeight,
	formatWeightAmount,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

export default function ProfilePage() {
	const params = useParams<{ userId?: string[] }>()
	const routeIdentifier = Array.isArray(params?.userId)
		? params.userId[0]
		: undefined

	const { user: viewer, isLoading: isViewerLoading } = useUser()
	const isOwnByRoute =
		!routeIdentifier ||
		Boolean(
			viewer &&
			(routeIdentifier === viewer.id ||
				normalizeUsername(routeIdentifier) === viewer.username),
		)
	const { data: publicUser, isLoading: isPublicLoading } = usePublicUser(
		isOwnByRoute ? '' : routeIdentifier || '',
	)
	// Both are viewer-scoped endpoints, so the numbers they return only ever
	// describe the signed-in user -- they are rendered on your own profile only.
	const { data: progress } = useWorkoutProgress()
	const { data: stats } = useWorkoutStats()
	const targetUserId = publicUser?.id || ''
	const followMutation = useFollowUser(targetUserId, routeIdentifier || '')
	const unfollowMutation = useUnfollowUser(targetUserId, routeIdentifier || '')

	if (isViewerLoading || (!isOwnByRoute && isPublicLoading)) {
		return (
			<div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
				<Skeleton className="h-[200px] w-full rounded-xl" />
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Skeleton className="h-[400px] w-full rounded-xl md:col-span-1" />
					<Skeleton className="h-[400px] w-full rounded-xl md:col-span-2" />
				</div>
			</div>
		)
	}

	if (!viewer) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">
					User not found or not authenticated.
				</p>
			</div>
		)
	}

	if (!isOwnByRoute && !publicUser) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
				<h1 className="type-section text-foreground">User not found</h1>
				<p className="type-body-sm text-ink-3">
					Check the username and try again.
				</p>
			</div>
		)
	}

	const isOwnProfile = isOwnByRoute
	const profile = isOwnProfile ? viewer : publicUser!
	const profileName = profile.name
	const profileUsername = profile.username
	const profileLastName = profile.lastName
	const profileAvatar = profile.avatarUrl
	const profileCreatedAt = profile.createdAt
	const followerCount = profile.followerCount
	const followingCount = profile.followingCount
	const isFollowedByMe = isOwnProfile ? false : publicUser!.isFollowedByMe
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
	const weightUnit = viewer.weightUnit ?? 'KG'
	const totalVolume = kilogramsToDisplayWeight(totalVolumeKg, weightUnit)
	const canViewRecords = isOwnProfile || publicUser!.viewerAccess.records
	const personalRecords = isOwnProfile
		? (progress?.personalRecords ?? [])
		: (publicUser!.personalRecords ?? [])
	const canViewBodyMetrics =
		isOwnProfile || publicUser!.viewerAccess.bodyMetrics
	const bodyMetrics = isOwnProfile
		? {
				age: viewer.age,
				sex: viewer.sex,
				weightKg: viewer.weight,
				heightCm: viewer.height,
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
	const isMutating = followMutation.isPending || unfollowMutation.isPending

	const onFollowToggle = () => {
		if (!targetUserId || isOwnProfile) return
		if (isFollowedByMe) {
			unfollowMutation.mutate()
			return
		}
		followMutation.mutate()
	}

	return (
		<div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
			<Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm relative shadow-sm">
				<div className="h-32 md:h-48 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
					<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
					<div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-card/80 to-transparent backdrop-blur-[2px]"></div>
				</div>

				<div className="px-6 md:px-10 pb-8 relative">
					<div className="flex flex-col md:flex-row gap-6 md:items-end -mt-16 md:-mt-20">
						<div className="relative group self-center md:self-start">
							<div className="absolute -inset-0.5 bg-gradient-to-br from-primary via-primary/50 to-transparent rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
							<Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card relative z-10 shadow-xl bg-card">
								<AvatarImage
									src={profileAvatar || ''}
									alt={profileName}
									className="object-cover"
								/>
								<AvatarFallback className="text-4xl bg-primary/10 text-primary font-serif">
									{profileName.charAt(0)}
									{profileLastName?.charAt(0)}
								</AvatarFallback>
							</Avatar>
						</div>

						<div className="flex-1 text-center md:text-left space-y-2 mt-4 md:mt-0">
							{/* FIX-02: nothing on UserProfile or PublicUserProfile carries a
							membership, plan or tier, so no badge rendered here can be backed by
							real account state. Titles and ranks are owned by ACH-02/ACH-03; do
							not re-add one ad hoc. */}
							<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground heading-classical">
								{profileName} {profileLastName}
							</h1>
							<p className="type-data text-ink-3">@{profileUsername}</p>
							<p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-1.5 text-sm md:text-base">
								<CalendarDays className="h-4 w-4" /> Joined {joinDateText}
							</p>

							{/* FIX-06: these counts are text, not controls. They used to carry
							cursor-pointer and a hover state while leading nowhere. The browsable
							follower/following lists, and the paginated endpoint they need, belong
							to SOC-02. */}
							<div className="flex gap-4 justify-center md:justify-start pt-2">
								<div className="flex items-baseline gap-1.5">
									<span className="text-lg font-bold heading-classical">
										{followerCount}
									</span>
									<span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
										Followers
									</span>
								</div>
								<div className="flex items-baseline gap-1.5">
									<span className="text-lg font-bold heading-classical">
										{followingCount}
									</span>
									<span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
										Following
									</span>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-center md:justify-end gap-3 mt-4 md:mt-0 w-full md:w-auto">
							<Button
								variant="outline"
								size="sm"
								className="hidden sm:flex border-primary/20 hover:bg-primary/10 transition-colors"
							>
								<Share2 className="h-4 w-4 mr-2" /> Share Profile
							</Button>
							{!isOwnProfile && (
								<Button
									variant={isFollowedByMe ? 'outline' : 'default'}
									size="sm"
									onClick={onFollowToggle}
									disabled={isMutating}
								>
									{isFollowedByMe ? (
										<>
											<UserMinus className="h-4 w-4 mr-2" />
											{isMutating ? 'Unfollowing...' : 'Unfollow'}
										</>
									) : (
										<>
											<UserPlus className="h-4 w-4 mr-2" />
											{isMutating ? 'Following...' : 'Follow'}
										</>
									)}
								</Button>
							)}
						</div>
					</div>
				</div>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="space-y-6 lg:col-span-1 border-r-0 lg:border-r border-border/40 pr-0 lg:pr-6">
					<div className="space-y-4">
						<h2 className="text-xl font-semibold heading-classical flex items-center gap-2">
							<User className="h-5 w-5 text-primary" /> About
						</h2>
						{/* FIX-01: this block used to state the same invented biography and
						location ("San Francisco, CA") for every user, on other people's
						profiles too. Neither UserProfile nor PublicUserProfile carries a bio
						or location field, so there is nothing real to render yet. PROF-04
						adds the editable fields and their per-field visibility. */}
						<p className="text-muted-foreground text-sm leading-relaxed">
							No bio yet.
						</p>
					</div>

					<div className="space-y-4">
						<h2 className="text-xl font-semibold heading-classical">
							Body Metrics
						</h2>
						{!canViewBodyMetrics ? (
							<p className="text-muted-foreground text-sm">
								Body metrics are private.
							</p>
						) : !hasBodyMetrics ? (
							<p className="text-muted-foreground text-sm">
								No body metrics added yet.
							</p>
						) : (
							<dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
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
					</div>
				</div>

				<div className="lg:col-span-2 space-y-6">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<Card className="bg-gradient-to-br from-card to-card/50 border-border/40 shadow-sm relative overflow-hidden group">
							<div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300">
								<Dumbbell className="h-24 w-24 text-primary" />
							</div>
							<CardContent className="p-4 sm:p-5">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
										Workouts
									</span>
									<Dumbbell className="h-4 w-4 text-primary" />
								</div>
								<div className="text-3xl font-bold heading-classical">
									{canViewWorkoutHistory ? totalWorkouts : '—'}
								</div>
								<div className="text-xs text-emerald-500 mt-1 font-medium">
									{canViewWorkoutHistory
										? isOwnProfile
											? `+${weeklyWorkouts} this week`
											: 'Lifetime completed'
										: ' '}
								</div>
							</CardContent>
						</Card>

						<Card className="bg-gradient-to-br from-card to-card/50 border-border/40 shadow-sm relative overflow-hidden group">
							<div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300">
								<Flame className="h-24 w-24 text-orange-500" />
							</div>
							<CardContent className="p-4 sm:p-5">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
										Streak
									</span>
									<Flame className="h-4 w-4 text-orange-500" />
								</div>
								<div className="text-3xl font-bold heading-classical">
									{canViewWorkoutHistory ? currentStreak : '—'}{' '}
									{canViewWorkoutHistory ? (
										<span className="text-lg text-muted-foreground font-normal">
											days
										</span>
									) : null}
								</div>
								<div className="text-xs text-muted-foreground mt-1 font-medium">
									{canViewWorkoutHistory ? `Personal Best: ${bestStreak}` : ' '}
								</div>
							</CardContent>
						</Card>

						<Card className="bg-gradient-to-br from-card to-card/50 border-border/40 shadow-sm relative overflow-hidden group sm:col-span-2">
							<div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300">
								<Activity className="h-24 w-24 text-blue-500" />
							</div>
							<CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
										Volume Lifted Total
									</span>
									<Activity className="h-4 w-4 text-blue-500" />
								</div>
								<div className="flex items-end gap-2">
									<div className="text-3xl font-bold heading-classical">
										{canViewWorkoutHistory ? volumeLabel : '—'}
									</div>
									{canViewWorkoutHistory ? (
										<div className="text-sm text-muted-foreground mb-1 font-medium">
											{getWeightUnitLabel(weightUnit)}
										</div>
									) : null}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card className="border-border/40 bg-card/30 backdrop-blur-sm shadow-sm p-6 overflow-hidden relative">
						<div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/[0.01] to-transparent pointer-events-none"></div>
						<h3 className="text-lg font-semibold heading-classical mb-6 flex items-center gap-2">
							<Trophy className="h-5 w-5 text-primary" /> Personal Records
						</h3>

						<div className="space-y-4">
							{!canViewRecords || personalRecords.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									{!canViewRecords
										? 'Personal records are private.'
										: isOwnProfile
											? 'Log a few sets and your records will show up here.'
											: 'No personal records yet.'}
								</p>
							) : (
								personalRecords.map(record => (
									<div
										key={record.exerciseId}
										className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 group"
									>
										<div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border shadow-sm transition-colors duration-[var(--motion-fast)] ease-standard">
											<Medal className="h-5 w-5 text-yellow-500" />
										</div>
										<div className="flex-1">
											<h4 className="font-semibold text-sm">
												{record.exerciseName}
											</h4>
											<p className="text-xs text-muted-foreground">
												{formatWeight(record.weight, weightUnit)} for{' '}
												{record.reps} reps · est. 1RM{' '}
												{formatWeight(record.estimated1rm, weightUnit)}
											</p>
										</div>
										<span className="text-xs text-muted-foreground whitespace-nowrap">
											{formatTimeAgo(record.achievedAt)}
										</span>
									</div>
								))
							)}
						</div>
					</Card>
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
			<dt className="text-xs uppercase tracking-wider text-ink-3">{label}</dt>
			<dd
				className={
					capitalize ? 'capitalize text-foreground' : 'text-foreground'
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

function Medal(props: React.SVGProps<SVGSVGElement>) {
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
			<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
			<path d="M11 12 5.12 2.2" />
			<path d="m13 12 5.88-9.8" />
			<path d="M8 7h8" />
			<circle cx="12" cy="17" r="5" />
			<path d="M12 18v-2h-.5" />
		</svg>
	)
}
