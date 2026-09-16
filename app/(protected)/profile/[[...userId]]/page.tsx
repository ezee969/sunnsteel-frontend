'use client'

import { useParams } from 'next/navigation'

import { ProfileLoading } from '@/features/profile/profile-loading'
import { ProfileView } from '@/features/profile/profile-view'
import { RelationshipListsView } from '@/features/profile/relationship-lists-view'
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
import { normalizeUsername } from '@/lib/utils/username'

function getRelationshipHrefs(username: string) {
	return {
		followers: getRelationshipListHref(username, 'followers'),
		following: getRelationshipListHref(username, 'following'),
	}
}

export default function ProfilePage() {
	const params = useParams<{ userId?: string[] }>()
	const segments = Array.isArray(params?.userId) ? params.userId : []
	const routeIdentifier = segments[0]
	// `/profile/<identifier>/<followers|following|mutuals>` (SOC-02). Any other
	// sub-path is not a page, rather than a silent alias of the profile.
	const relationshipKind = parseRelationshipListKind(segments[1])
	const isUnknownSubpath =
		segments.length > 2 || (segments.length === 2 && !relationshipKind)
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
		return <ProfileNotFound title="Page not found" />
	}

	if (isViewerLoading || isPublicLoading) {
		return <ProfileLoading />
	}

	if (!viewer) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					User not found or not authenticated.
				</p>
			</div>
		)
	}

	if (isOwnByRoute) {
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
				weightUnit={viewer.weightUnit}
				relationshipHrefs={getRelationshipHrefs(viewer.username)}
			/>
		)
	}

	if (!publicUser) {
		return <ProfileNotFound title="User not found" />
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
			isMutating={followMutation.isPending || unfollowMutation.isPending}
			onFollowToggle={onFollowToggle}
			relationshipHrefs={getRelationshipHrefs(publicUser.username)}
		/>
	)
}

function ProfileNotFound({ title }: { title: string }) {
	return (
		<div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
			<h1 className="type-section text-foreground">{title}</h1>
			<p className="type-body-sm text-ink-3">
				Check the username and try again.
			</p>
		</div>
	)
}
