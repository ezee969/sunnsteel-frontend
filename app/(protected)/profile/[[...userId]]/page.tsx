'use client'

import { useParams } from 'next/navigation'

import { ProfileLoading } from '@/features/profile/profile-loading'
import { ProfileView } from '@/features/profile/profile-view'
import { useFollowUser } from '@/lib/api/hooks/useFollowUser'
import { usePublicUser } from '@/lib/api/hooks/usePublicUser'
import { useUnfollowUser } from '@/lib/api/hooks/useUnfollowUser'
import { useUser } from '@/lib/api/hooks/useUser'
import {
	useWorkoutProgress,
	useWorkoutStats,
} from '@/lib/api/hooks/useWorkoutSession'
import { normalizeUsername } from '@/lib/utils/username'

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
		return (
			<ProfileView
				variant="owner"
				profile={viewer}
				progress={progress}
				stats={stats}
				weightUnit={viewer.weightUnit}
			/>
		)
	}

	if (!publicUser) {
		return (
			<div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
				<h1 className="type-section text-foreground">User not found</h1>
				<p className="type-body-sm text-ink-3">
					Check the username and try again.
				</p>
			</div>
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
		/>
	)
}
