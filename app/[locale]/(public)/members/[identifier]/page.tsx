'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ProfileLoading } from '@/features/profile/profile-loading'
import { ProfileView } from '@/features/profile/profile-view'
import { ProfileBodyProgress } from '@/features/progress/body-progress'
import { useSharedProfile } from '@/lib/api/hooks/useSharedProfile'
import { HttpError } from '@/lib/api/services/httpClient'
import { visitorUnits } from '@/lib/utils/visitor-units'

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
	// UX-26: a signed-out visitor's units come from their browser's region,
	// read after mount so the static page and the first render agree.
	const [units, setUnits] = useState(() => visitorUnits([]))
	useEffect(() => {
		setUnits(visitorUnits(navigator.languages ?? [navigator.language]))
	}, [])

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
			weightUnit={units.weightUnit}
			lengthUnit={units.lengthUnit}
			bodyProgress={
				<ProfileBodyProgress
					source={{ kind: 'public', identifier: profile.username }}
					weightUnit={units.weightUnit}
					lengthUnit={units.lengthUnit}
				/>
			}
		/>
	)
}
