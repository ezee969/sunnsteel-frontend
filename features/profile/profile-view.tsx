'use client'

import {
	FeaturedProfileItem,
	LengthUnit,
	PublicProfileAchievements,
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
	Scale,
	Share2,
	Target,
	Trophy,
	UserMinus,
	UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { RankCrest } from '@/features/achievements/rank-crest'
import { FeaturedAccomplishments } from '@/features/profile/featured-accomplishments'
import { MemberModerationMenu } from '@/features/profile/member-moderation-menu'
import { ProfileAchievements } from '@/features/profile/profile-achievements'
import {
	RankHeaderDecoration,
	RankPortraitOrnament,
	useRankDecorationAssets,
	useRankDecorationMotion,
} from '@/features/profile/rank-decoration/rank-decoration'
import { exerciseLabel, rankText } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFnsLocale, numberFormatter } from '@/i18n/date-locale'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/lib/utils/date'
import { formatHeight } from '@/lib/utils/length-unit'
import {
	copyTextToClipboard,
	getSharedProfileUrl,
} from '@/lib/utils/profile-sharing'
import { rankDecoration } from '@/lib/utils/rank-decoration'
import { profileRoutineHref } from '@/lib/utils/routine-sharing'
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

type RelationshipHrefs = { followers: string; following: string }

type ProfileViewProps = (
	| {
			variant: 'owner'
			profile: UserProfile
			progress?: WorkoutProgressResponse
			stats?: WorkoutStatsResponse
			featuredItems?: FeaturedProfileItem[]
			achievements?: PublicProfileAchievements
			weightUnit: WeightUnit
	  }
	| {
			variant: 'member'
			profile: PublicUserProfile
			weightUnit: WeightUnit
			isMutating?: boolean
			onFollowToggle?: () => void
	  }
) & {
	/** Only inside the authenticated shell; the public route keeps plain counts. */
	relationshipHrefs?: RelationshipHrefs
	/**
	 * SOC-03: the member's activity, rendered last in the main column. Only
	 * the authenticated shell passes one; activity is never shown signed out.
	 */
	activity?: React.ReactNode
	/** SOC-08 controls and explicitly granted partner-only schedule/routines. */
	trainingPartnerAction?: React.ReactNode
	trainingPartnerContent?: React.ReactNode
	/**
	 * PROG-12: the read-only body progress for this profile. Rendered only when
	 * the viewer may see it (the owner, or `viewerAccess.bodyProgress`).
	 */
	bodyProgress?: React.ReactNode
	/** PREF-04: the viewer's length unit, as `weightUnit` is the viewer's. */
	lengthUnit?: LengthUnit
}

/**
 * ACH-11 (§24.2): the room each rank's frame and portrait ornament take. The
 * frame answers to the header's own width (its compact pieces sit below
 * 600px), the portrait to the avatar, which grows at `sm`. A decorated header
 * puts the portrait beside the text only from 860px of its own width: below
 * that the frame and the ornament leave the text column too narrow, so it
 * stacks as it does on a phone.
 */
const RANK_HEADER_PADDING = [
	'pb-8',
	'pb-11',
	'px-[22px] pt-[26px] pb-9 @min-[600px]:px-[34px] @min-[600px]:pt-[34px] @min-[600px]:pb-11',
	'px-[22px] pt-10 pb-10 @min-[600px]:px-11 @min-[600px]:pt-[60px] @min-[600px]:pb-[50px]',
	'px-[22px] pt-[66px] pb-[46px] @min-[600px]:px-[46px] @min-[600px]:pt-20 @min-[600px]:pb-[58px]',
	// v1.1: below 600px Laureate's border band reaches 28px in, so a 30px
	// inset put the name's bracket on the inner rule; 42px gives it the room
	// the other ranks have.
	'px-[42px] pt-[70px] pb-[50px] @min-[600px]:px-[60px] @min-[600px]:pt-[92px] @min-[600px]:pb-[66px]',
] as const
/**
 * v1.1: the Artisan knots and Maestro scrolls are large enough to reach the
 * header's actions -- the knot was drawn over "Share profile" at 1440. The
 * actions keep clear of the corner they sit beside: above it while the
 * header is a column, left of it once it is a row (from 860px). The other
 * ranks' corners are small enough not to need it.
 */
const RANK_ACTIONS_CLEARANCE = [
	'',
	'',
	'mb-9 @min-[600px]:mb-12 @min-[860px]:mb-0 @min-[860px]:mr-16',
	'mb-7 @min-[600px]:mb-10 @min-[860px]:mb-0 @min-[860px]:mr-[100px]',
	'',
	'',
] as const
const RANK_PORTRAIT_MARGIN = [
	'm-[5px] sm:m-1.5',
	'm-2 sm:m-2.5',
	'm-3 sm:m-3.5',
	'mx-5 mt-5 mb-8 sm:mx-6 sm:mt-6 @min-[860px]:mb-0',
	'mx-6 mt-7 mb-8 sm:mx-7 sm:mt-7 @min-[860px]:mb-0',
	'mx-9 mt-10 mb-10 sm:mx-[46px] sm:mt-[46px] @min-[860px]:mb-0',
] as const

export function ProfileView(props: ProfileViewProps) {
	const locale = useLocale() as Locale
	const tIdentity = useTranslations('routines.identity')
	const tExercises = useTranslations('catalog.exercises')
	const tRanks = useTranslations('catalog.ranks')
	const t = useTranslations('social.profile')
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
	const featuredItems = isOwnProfile
		? (props.featuredItems ?? [])
		: publicUser!.featuredItems
	const canViewAchievements =
		isOwnProfile || publicUser!.viewerAccess.achievements
	/** ACH-10: present only when the rank rule lets this viewer see it. */
	const headerRank = isOwnProfile
		? (props.achievements?.rank ?? null)
		: (publicUser!.rank ?? null)
	/**
	 * ACH-11 (§24): the rank dresses the header only when the header shows it,
	 * so a rank the viewer may not see never decorates anything.
	 */
	const decoration = rankDecoration(headerRank)
	const decorationAssets = useRankDecorationAssets(decoration?.slug)
	const headerRef = React.useRef<HTMLElement>(null)
	useRankDecorationMotion(headerRef, decorationAssets !== null)
	/**
	 * PROF-08. Your own featured routine opens its real page, with the editing
	 * and sharing controls; somebody else's opens the read-only view under
	 * their profile. The signed-out route passes no `relationshipHrefs` and
	 * gets no link here either, because reading one needs an account.
	 */
	const featuredRoutineHref = isOwnProfile
		? (routineId: string) => `/routines/${routineId}`
		: props.relationshipHrefs
			? (routineId: string) => profileRoutineHref(profileUsername, routineId)
			: undefined
	const achievements = isOwnProfile
		? props.achievements
		: publicUser!.achievements
	const joinDateText = formatDistanceToNow(new Date(profileCreatedAt), {
		addSuffix: true,
		locale: dateFnsLocale(locale),
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
	const lengthUnit = props.lengthUnit ?? 'CM'
	const totalVolume = kilogramsToDisplayWeight(totalVolumeKg, weightUnit)
	const canViewRecords = isOwnProfile || publicUser!.viewerAccess.records
	const personalRecords = isOwnProfile
		? (progress?.personalRecords ?? [])
		: (publicUser!.personalRecords ?? [])
	const canViewBodyMetrics =
		isOwnProfile || publicUser!.viewerAccess.bodyMetrics
	const canViewBodyProgress =
		isOwnProfile || publicUser!.viewerAccess.bodyProgress === true
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
	// One fixed decimal, as `toFixed(1)` read; only the decimal mark follows
	// the language.
	const oneDecimal = (value: number) =>
		numberFormatter(locale, {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
			useGrouping: false,
		}).format(value)
	const volumeLabel =
		totalVolume >= 1_000_000
			? `${oneDecimal(totalVolume / 1_000_000)}M`
			: totalVolume >= 1_000
				? `${oneDecimal(totalVolume / 1_000)}k`
				: formatWeightAmount(totalVolumeKg, weightUnit, locale, 1)
	const isMutating = props.variant === 'member' && props.isMutating

	const onFollowToggle = () => {
		followAction?.()
	}

	const onShareProfile = async () => {
		try {
			const url = getSharedProfileUrl(profileUsername, window.location.origin)
			await copyTextToClipboard(url)
			push({
				title: t('linkCopied'),
				description: t('linkCopiedBody'),
				variant: 'success',
			})
		} catch {
			push({
				title: t('copyFailed'),
				description: t('copyFailedBody'),
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
			<section
				ref={headerRef}
				className={cn(
					decoration ? 'rank-deco relative @container' : 'rule-heading pb-6',
				)}
				style={decoration?.style}
				data-rank-tier={decoration?.tier}
			>
				{decoration && decorationAssets ? (
					<RankHeaderDecoration
						decoration={decoration}
						assets={decorationAssets}
					/>
				) : null}
				<div
					className={cn(
						'flex flex-col gap-5',
						decoration
							? cn(
									'relative @min-[860px]:flex-row @min-[860px]:items-end',
									RANK_HEADER_PADDING[decoration.tier],
								)
							: 'sm:flex-row sm:items-end',
					)}
				>
					<div
						className={cn(
							'relative h-20 w-20 shrink-0 sm:h-24 sm:w-24',
							decoration && RANK_PORTRAIT_MARGIN[decoration.tier],
						)}
					>
						<RankPortraitOrnament assets={decorationAssets} layer="behind" />
						<Avatar className="h-full w-full border border-rule">
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
						<RankPortraitOrnament assets={decorationAssets} layer="front" />
					</div>

					<div className="min-w-0 flex-1 space-y-1">
						{/* FIX-02: nothing on UserProfile or PublicUserProfile carries a
							membership, plan or tier, so no badge rendered here can be backed by
							real account state. The one mark beside the name is the ACH-10 rank
							below, read under its own privacy rule; do not add another ad hoc. */}
						<h1 className="type-page corner-brackets inline-block text-foreground">
							{profileName} {profileLastName}
						</h1>
						{/* ACH-10: the rank is the first thing after the name, under its
						    own privacy rule. The crest never stands without the name
						    (§19.2), and your own links to how it is earned. */}
						{headerRank ? (
							<p className="flex items-center gap-2 pt-1">
								<RankCrest rankId={headerRank.id} className="size-7" />
								{isOwnProfile ? (
									<Link
										href="/achievements"
										className="type-panel text-foreground underline-offset-4 hover:underline"
									>
										{rankText(headerRank, tRanks).title}
									</Link>
								) : (
									<span className="type-panel text-foreground">
										{rankText(headerRank, tRanks).title}
									</span>
								)}
							</p>
						) : null}
						<p className="type-data text-ink-3">@{profileUsername}</p>
						<p className="type-body-sm flex items-center gap-1.5 text-ink-3">
							<CalendarDays className="h-4 w-4" aria-hidden />{' '}
							{t('joined', { when: joinDateText })}
						</p>

						{/* SOC-02: inside the authenticated shell the counts open the
							browsable lists. The signed-out /members route passes no hrefs, so
							there they stay plain text (FIX-06): its visitors cannot read
							the lists. */}
						<div className="flex gap-5 pt-2">
							<ProfileCount
								count={followerCount}
								label={t('followers')}
								href={props.relationshipHrefs?.followers}
							/>
							<ProfileCount
								count={followingCount}
								label={t('following')}
								href={props.relationshipHrefs?.following}
							/>
						</div>
					</div>

					<div
						className={cn(
							'flex flex-wrap gap-3',
							decoration && RANK_ACTIONS_CLEARANCE[decoration.tier],
						)}
					>
						<Button variant="outline" size="sm" onClick={onShareProfile}>
							<Share2 className="mr-2 h-4 w-4" aria-hidden />{' '}
							{t('shareProfile')}
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
										{isMutating ? t('unfollowing') : t('unfollow')}
									</>
								) : (
									<>
										<UserPlus className="mr-2 h-4 w-4" aria-hidden />
										{isMutating ? t('followingPending') : t('follow')}
									</>
								)}
							</Button>
						)}
						{props.trainingPartnerAction}
						{/* PROF-10: blocking and reporting are only ever about somebody
						    else, and only inside the authenticated shell — the signed-out
						    route has no viewer to act as. */}
						{!isOwnProfile && publicUser && props.relationshipHrefs ? (
							<MemberModerationMenu profile={publicUser} />
						) : null}
					</div>
				</div>
			</section>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
				<div className="space-y-8 lg:col-span-1 lg:border-r lg:border-rule-faint lg:pr-8">
					<section className="space-y-3">
						<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
							<User className="h-4 w-4 text-ink-3" aria-hidden /> {t('about')}
						</h2>
						<p className="type-body-sm whitespace-pre-line text-ink-2">
							{!canViewBiography ? t('bioPrivate') : biography || t('noBio')}
						</p>
						<div className="type-body-sm flex items-start gap-2 text-ink-2">
							<MapPin
								className="mt-0.5 h-4 w-4 shrink-0 text-ink-3"
								aria-hidden
							/>
							<span>
								{!canViewLocation
									? t('locationPrivate')
									: location || t('noLocation')}
							</span>
						</div>
					</section>

					<section className="space-y-3">
						<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
							<Target className="h-4 w-4 text-ink-3" aria-hidden />
							{t('trainingIdentity')}
						</h2>
						{!canViewTrainingIdentity ? (
							<p className="type-body-sm text-ink-3">{t('identityPrivate')}</p>
						) : !hasTrainingIdentityContent || !trainingIdentity ? (
							<p className="type-body-sm text-ink-3">{t('noIdentity')}</p>
						) : (
							<dl className="type-body-sm space-y-4 text-foreground">
								{trainingIdentity.goals.length > 0 ? (
									<div className="space-y-2">
										<dt className="type-label text-ink-3">{t('goals')}</dt>
										<dd className="flex flex-wrap gap-2">
											{trainingIdentity.goals.map(goal => (
												<Badge key={goal} variant="secondary">
													{getTrainingGoalLabel(goal, tIdentity)}
												</Badge>
											))}
										</dd>
									</div>
								) : null}
								{trainingIdentity.experienceLevel ? (
									<div className="space-y-1">
										<dt className="type-label text-ink-3">{t('experience')}</dt>
										<dd>
											{getTrainingExperienceLabel(
												trainingIdentity.experienceLevel,
												tIdentity,
											)}
										</dd>
									</div>
								) : null}
								{trainingIdentity.disciplines.length > 0 ? (
									<div className="space-y-2">
										<dt className="type-label text-ink-3">
											{t('disciplines')}
										</dt>
										<dd className="flex flex-wrap gap-2">
											{trainingIdentity.disciplines.map(discipline => (
												<Badge key={discipline} variant="outline">
													{getTrainingDisciplineLabel(discipline, tIdentity)}
												</Badge>
											))}
										</dd>
									</div>
								) : null}
								{trainingIdentity.preferredStyle ? (
									<div className="space-y-1">
										<dt className="type-label text-ink-3">
											{t('preferredStyle')}
										</dt>
										<dd>
											{getPreferredTrainingStyleLabel(
												trainingIdentity.preferredStyle,
												tIdentity,
											)}
										</dd>
									</div>
								) : null}
								{trainingIdentity.favoriteExercises.length > 0 ? (
									<div className="space-y-2">
										<dt className="type-label text-ink-3">
											{t('favoriteExercises')}
										</dt>
										<dd>
											<ul className="space-y-1 text-ink-2">
												{trainingIdentity.favoriteExercises.map(exercise => (
													<li key={exercise.id}>
														{exerciseLabel(exercise.name, tExercises)}
													</li>
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
							{t('bodyMetrics')}
						</h2>
						{!canViewBodyMetrics ? (
							<p className="type-body-sm text-ink-3">
								{t('bodyMetricsPrivate')}
							</p>
						) : !hasBodyMetrics ? (
							<p className="type-body-sm text-ink-3">{t('noBodyMetrics')}</p>
						) : (
							<dl className="grid grid-cols-2 gap-x-4 gap-y-3">
								<BodyMetric label={t('age')} value={bodyMetrics?.age} />
								<BodyMetric
									label={t('sex')}
									value={
										bodyMetrics?.sex
											? t('sexValue', { sex: bodyMetrics.sex })
											: null
									}
									capitalize
								/>
								<BodyMetric
									label={t('weight')}
									value={
										bodyMetrics?.weightKg == null
											? null
											: formatWeight(bodyMetrics.weightKg, weightUnit, locale)
									}
								/>
								<BodyMetric
									label={t('height')}
									value={
										bodyMetrics?.heightCm == null
											? null
											: formatHeight(bodyMetrics.heightCm, lengthUnit, locale)
									}
								/>
							</dl>
						)}
					</section>
				</div>

				<div className="space-y-8 lg:col-span-2">
					<FeaturedAccomplishments
						items={featuredItems}
						weightUnit={weightUnit}
						isOwnProfile={isOwnProfile}
						routineHref={featuredRoutineHref}
					/>

					<ProfileAchievements
						data={achievements}
						canView={canViewAchievements}
						isOwnProfile={isOwnProfile}
					/>

					{/* Final review 7: the three boxed stat cards with oversized
					    watermark icons and emerald/orange/blue trend colours become one
					    ruled band, the dashboard's pattern (§10.1). None of those
					    colours meant anything the palette defines. */}
					<div className="grid grid-cols-2 gap-px border-y border-rule bg-rule-faint sm:grid-cols-4">
						<div className="flex flex-col gap-2 bg-background px-3 py-4 sm:px-4">
							<div className="flex items-center gap-2 text-ink-3">
								<Dumbbell className="h-4 w-4 shrink-0" aria-hidden />
								<span className="type-label">{t('workouts')}</span>
							</div>
							<span className="type-numeral text-foreground">
								{canViewWorkoutHistory ? totalWorkouts : '—'}
							</span>
							<span className="type-body-sm text-ink-3">
								{canViewWorkoutHistory
									? isOwnProfile
										? t('thisWeek', { count: weeklyWorkouts })
										: t('lifetime')
									: ' '}
							</span>
						</div>

						<div className="flex flex-col gap-2 bg-background px-3 py-4 sm:px-4">
							<div className="flex items-center gap-2 text-ink-3">
								<Flame className="h-4 w-4 shrink-0" aria-hidden />
								<span className="type-label">{t('streak')}</span>
							</div>
							<div className="flex flex-wrap items-baseline gap-x-1.5">
								<span className="type-numeral text-foreground">
									{canViewWorkoutHistory ? currentStreak : '—'}
								</span>
								{canViewWorkoutHistory ? (
									<span className="type-data text-ink-3">{t('days')}</span>
								) : null}
							</div>
							<span className="type-body-sm text-ink-3">
								{canViewWorkoutHistory
									? t('personalBest', { days: bestStreak })
									: ' '}
							</span>
						</div>

						<div className="col-span-2 flex flex-col gap-2 bg-background px-3 py-4 sm:px-4">
							<div className="flex items-center gap-2 text-ink-3">
								<Activity className="h-4 w-4 shrink-0" aria-hidden />
								<span className="type-label">{t('volumeTotal')}</span>
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
					<section id="personal-records" className="scroll-mt-24">
						<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
							<Trophy className="h-4 w-4 text-honour" aria-hidden />{' '}
							{t('personalRecords')}
						</h2>
						{!canViewRecords || personalRecords.length === 0 ? (
							<p className="type-body-sm py-3 text-ink-3">
								{!canViewRecords
									? t('recordsPrivate')
									: isOwnProfile
										? t('recordsEmptyOwn')
										: t('recordsEmpty')}
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
												{exerciseLabel(record.exerciseName, tExercises)}
											</h3>
											<p className="type-body-sm text-ink-3">
												{t.rich('recordLine', {
													weight: formatWeight(
														record.weight,
														weightUnit,
														locale,
													),
													reps: record.reps,
													e1rm: formatWeight(
														record.estimated1rm,
														weightUnit,
														locale,
													),
													data: chunks => (
														<span className="type-data text-ink-2">
															{chunks}
														</span>
													),
												})}
											</p>
										</div>
										<span className="type-body-sm shrink-0 whitespace-nowrap text-ink-3">
											{formatTimeAgo(record.achievedAt, locale)}
										</span>
									</div>
								))}
							</div>
						)}
					</section>

					{props.bodyProgress !== undefined ? (
						<section id="body-progress" className="scroll-mt-24">
							<h2 className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground">
								<Scale className="h-4 w-4 text-ink-3" aria-hidden />{' '}
								{t('bodyProgress')}
							</h2>
							{canViewBodyProgress ? (
								props.bodyProgress
							) : (
								<p className="type-body-sm py-3 text-ink-3">
									{t('bodyProgressPrivate')}
								</p>
							)}
						</section>
					) : null}

					{props.trainingPartnerContent}
					{props.activity}
				</div>
			</div>
		</div>
	)
}

function ProfileCount({
	count,
	label,
	href,
}: {
	count: number
	label: string
	href?: string
}) {
	const content = (
		<>
			<span className="type-data type-data-strong text-foreground">
				{count}
			</span>
			<span className="type-body-sm text-ink-3 underline-offset-4 transition-colors duration-[var(--motion-fast)] ease-standard group-hover:text-foreground group-hover:underline">
				{label}
			</span>
		</>
	)
	if (!href) {
		return <p className="flex items-baseline gap-1.5">{content}</p>
	}
	return (
		<Link
			href={href}
			className="group flex items-baseline gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			{content}
		</Link>
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
