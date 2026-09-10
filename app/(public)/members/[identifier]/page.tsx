'use client'

import { useParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ProfileLoading } from '@/features/profile/profile-loading'
import { ProfileView } from '@/features/profile/profile-view'
import { useSharedProfile } from '@/lib/api/hooks/useSharedProfile'
import { HttpError } from '@/lib/api/services/httpClient'

export default function SharedProfilePage() {
	const params = useParams<{ identifier: string }>()
	const identifier = params?.identifier || ''
	const {
		data: profile,
		error,
		isLoading,
		refetch,
	} = useSharedProfile(identifier)

	if (isLoading) return <ProfileLoading />

	if (!profile) {
		const isNotFound = error instanceof HttpError && error.status === 404
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
				<h1 className="type-section text-foreground">
					{isNotFound ? 'Profile not found' : 'Could not load this profile'}
				</h1>
				<p className="type-body-sm max-w-md text-ink-3">
					{isNotFound
						? 'Check the username and try again.'
						: 'Check your connection and try again.'}
				</p>
				{!isNotFound && (
					<Button variant="outline" onClick={() => refetch()}>
						Try again
					</Button>
				)}
			</div>
		)
	}

	return <ProfileView variant="member" profile={profile} weightUnit="KG" />
}
