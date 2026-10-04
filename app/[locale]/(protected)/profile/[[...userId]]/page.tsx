'use client'

import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { MemberActivity } from '@/features/profile/member-activity'
import { ProfileLoading } from '@/features/profile/profile-loading'
import { ProfileView } from '@/features/profile/profile-view'
import { RelationshipListsView } from '@/features/profile/relationship-lists-view'
import { TrainingPartnerAction } from '@/features/profile/training-partner-action'
import { TrainingPartnerSharedSections } from '@/features/profile/training-partner-shared-sections'
import { ProfileBodyProgress } from '@/features/progress/body-progress'
import { MemberRoutineView } from '@/features/routines/components/MemberRoutineView'
import { useFollowUser } from '@/lib/api/hooks/useFollowUser'
import { usePublicUser } from '@/lib/api/hooks/usePublicUser'
import { useUnfollowUser } from '@/lib/api/hooks/useUnfollowUser'
import { useUser } from '@/lib/api/hooks/useUser'
import {
	useWorkoutProgress,
	useWorkoutStats,
} from '@/lib/api/hooks/useWorkoutSession'
import {
	getRelationshipListHref,
	parseRelationshipListKind,
} from '@/lib/utils/relationships'
import { parseProfileRoutineId } from '@/lib/utils/routine-sharing'
import { normalizeUsername } from '@/lib/utils/username'

function getRelationshipHrefs(username: string) {
	return {
		followers: getRelationshipListHref(username, 'followers'),
		following: getRelationshipListHref(username, 'following'),
	}
}

export default function ProfilePage() {
	const t = useTranslations('social.profilePage')
	const params = useParams<{ userId?: string[] }>()
	const segments = Array.isArray(params?.userId) ? params.userId : []
	const routeIdentifier = segments[0]
	// `/profile/<identifier>/<followers|following|mutuals>` (SOC-02). Any other
	// sub-path is not a page, rather than a silent alias of the profile.
	const relationshipKind = parseRelationshipListKind(segments[1])
	// `/profile/<identifier>/routines/<routineId>` (PROF-08/ROUT-05): one of
	// that member's routines, read under the same ROUT-04 rule as anywhere else.
	const profileRoutineId = parseProfileRoutineId(segments)
	const isUnknownSubpath =
		segments.length > 3 ||
		(segments.length === 3 && !profileRoutineId) ||
		(segments.length === 2 && !relationshipKind)
	const { user: viewer, isLoading: isViewerLoading } = useUser()
	const isOwnByRoute =
		!routeIdentifier ||
		Boolean(
			viewer &&
			(routeIdentifier === viewer.id ||
				normalizeUsername(routeIdentifier) === viewer.username),
		)
	const publicProfileIdentifier = isUnknownSubpath
		? ''
		: isOwnByRoute
			? viewer?.username || ''
			: routeIdentifier || ''
	const { data: publicUser, isLoading: isPublicLoading } = usePublicUser(
		publicProfileIdentifier,
	)
	// Both are viewer-scoped endpoints, so the numbers they return only ever
	// describe the signed-in user -- they are rendered on your own profile only.
	const { data: progress } = useWorkoutProgress()
	const { data: stats } = useWorkoutStats()
	const targetUserId = publicUser?.id || ''
	const followMutation = useFollowUser(targetUserId, routeIdentifier || '')
	const unfollowMutation = useUnfollowUser(targetUserId, routeIdentifier || '')

	if (isUnknownSubpath) {
		return <ProfileNotFound title={t('pageNotFound')} />
	}

	if (isViewerLoading || isPublicLoading) {
		return <ProfileLoading />
	}

	if (!viewer) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">{t('notAuthenticated')}</p>
			</div>
		)
	}

	if (isOwnByRoute) {
		// Your own routine already has a page, with its editing and sharing
		// controls; the shared view would be a worse copy of it.
		if (profileRoutineId) {
			return <OwnRoutineRedirect routineId={profileRoutineId} />
		}
		if (relationshipKind) {
			return (
				<RelationshipListsView
					profile={viewer}
					kind={relationshipKind}
					viewerId={viewer.id}
					isOwn
					profileHref="/profile"
				/>
			)
		}
		return (
			<ProfileView
				variant="owner"
				profile={viewer}
				progress={progress}
				stats={stats}
				featuredItems={publicUser?.featuredItems}
				achievements={publicUser?.achievements}
				weightUnit={viewer.weightUnit}
				lengthUnit={viewer.lengthUnit ?? 'CM'}
				relationshipHrefs={getRelationshipHrefs(viewer.username)}
				bodyProgress={
					<ProfileBodyProgress
						source={{ kind: 'own' }}
						weightUnit={viewer.weightUnit}
						lengthUnit={viewer.lengthUnit ?? 'CM'}
					/>
				}
			/>
		)
	}

	if (!publicUser) {
		return <ProfileNotFound title={t('userNotFound')} />
	}

	if (profileRoutineId) {
		return (
			<MemberRoutineView
				identifier={publicUser.username}
				routineId={profileRoutineId}
				profileHref={`/profile/${encodeURIComponent(publicUser.username)}`}
			/>
		)
	}

	if (relationshipKind) {
		return (
			<RelationshipListsView
				profile={publicUser}
				kind={relationshipKind}
				viewerId={viewer.id}
				isOwn={false}
				profileHref={`/profile/${encodeURIComponent(publicUser.username)}`}
			/>
		)
	}

	const onFollowToggle = () => {
		if (publicUser.isFollowedByMe) {
			unfollowMutation.mutate()
			return
		}
		followMutation.mutate()
	}

	return (
		<ProfileView
			variant="member"
			profile={publicUser}
			weightUnit={viewer.weightUnit}
			lengthUnit={viewer.lengthUnit ?? 'CM'}
			isMutating={followMutation.isPending || unfollowMutation.isPending}
			onFollowToggle={onFollowToggle}
			relationshipHrefs={getRelationshipHrefs(publicUser.username)}
			trainingPartnerAction={<TrainingPartnerAction member={publicUser} />}
			bodyProgress={
				<ProfileBodyProgress
					source={{ kind: 'member', identifier: publicUser.username }}
					weightUnit={viewer.weightUnit}
					lengthUnit={viewer.lengthUnit ?? 'CM'}
				/>
			}
			trainingPartnerContent={
				<TrainingPartnerSharedSections
					memberId={publicUser.id}
					identifier={publicUser.username}
				/>
			}
			activity={
				<MemberActivity
					identifier={publicUser.username}
					weightUnit={viewer.weightUnit}
				/>
			}
		/>
	)
}

function OwnRoutineRedirect({ routineId }: { routineId: string }) {
	const router = useRouter()
	useEffect(() => {
		router.replace(`/routines/${routineId}`)
	}, [router, routineId])
	return <ProfileLoading />
}

function ProfileNotFound({ title }: { title: string }) {
	const t = useTranslations('social.profilePage')
	return (
		<div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
			<h1 className="type-section text-foreground">{title}</h1>
			<p className="type-body-sm text-ink-3">{t('checkUsername')}</p>
		</div>
	)
}
