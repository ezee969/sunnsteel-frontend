'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { ProfileLoading } from '@/features/profile/profile-loading'
import { ProfileView } from '@/features/profile/profile-view'
import { ProfileBodyProgress } from '@/features/progress/body-progress'
import { useSharedProfile } from '@/lib/api/hooks/useSharedProfile'
import { HttpError } from '@/lib/api/services/httpClient'

export default function SharedProfilePage() {
	const t = useTranslations('core.memberProfile')

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
					{isNotFound ? t('notFoundTitle') : t('loadErrorTitle')}
				</h1>
				<p className="type-body-sm max-w-md text-ink-3">
					{isNotFound ? t('notFoundDescription') : t('loadErrorDescription')}
				</p>
				{!isNotFound && (
					<Button variant="outline" onClick={() => refetch()}>
						{t('tryAgain')}
					</Button>
				)}
			</div>
		)
	}

	return (
		<ProfileView
			variant="member"
			profile={profile}
			weightUnit="KG"
			lengthUnit="CM"
			bodyProgress={
				<ProfileBodyProgress
					source={{ kind: 'public', identifier: profile.username }}
					weightUnit="KG"
					lengthUnit="CM"
				/>
			}
		/>
	)
}
