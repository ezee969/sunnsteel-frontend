'use client'

import type {
	ProfilePrivacySettings,
	ProfileVisibility,
} from '@sunsteel/contracts'
import { ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { SaveStatus } from '@/components/layout/save-status'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useUpdateProfilePrivacy } from '@/lib/api/hooks/useUpdateProfilePrivacy'
import {
	PRIVACY_AUDIENCE_KEYS,
	PRIVACY_SECTION_LABEL_KEYS,
} from '@/lib/utils/privacy-overview'

const PRIVACY_FIELDS: Array<keyof ProfilePrivacySettings> = [
	'biography',
	'location',
	'trainingIdentity',
	'workoutHistory',
	'records',
	'bodyMetrics',
	'bodyProgress',
	'routines',
	'rank',
	'achievements',
]

const VISIBILITY_OPTIONS: ProfileVisibility[] = [
	'PRIVATE',
	'FOLLOWERS',
	'PUBLIC',
]

interface ProfilePrivacySettingsCardProps {
	settings: ProfilePrivacySettings
}

export function ProfilePrivacySettingsCard({
	settings,
}: ProfilePrivacySettingsCardProps) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('settings.profilePrivacy')
	const tOverview = useTranslations('settings.privacyOverview')
	const [draft, setDraft] = useState(settings)
	const updatePrivacy = useUpdateProfilePrivacy()
	const { push } = useToast()

	useEffect(() => {
		setDraft(settings)
	}, [settings])

	// UX-26 (§28.7): a choice saves when it is made, and SaveStatus says so;
	// a failed save puts the stored setting back and says why.
	const choose = (key: (typeof PRIVACY_FIELDS)[number], value: string) => {
		if (!VISIBILITY_OPTIONS.includes(value as ProfileVisibility)) return
		if (value === draft[key]) return
		const next = { ...draft, [key]: value as ProfileVisibility }
		setDraft(next)
		updatePrivacy.mutate(next, {
			onError: error => {
				setDraft(settings)
				push({
					title: t('failedTitle'),
					description: errorText(error),
					variant: 'destructive',
				})
			},
		})
	}

	return (
		<Card id="profile-privacy" className="scroll-mt-24">
			<CardHeader>
				<div className="flex items-center gap-2">
					<ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<CardDescription>{t('description')}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="divide-y divide-rule">
					{PRIVACY_FIELDS.map(key => (
						<div
							key={key}
							className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"
						>
							<div className="space-y-1">
								<Label htmlFor={`privacy-${key}`}>
									{tOverview(PRIVACY_SECTION_LABEL_KEYS[key])}
								</Label>
								<p className="type-body-sm text-ink-3">{t(`field.${key}`)}</p>
							</div>
							<Select
								value={draft[key]}
								onValueChange={value => choose(key, value)}
							>
								<SelectTrigger id={`privacy-${key}`} className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{VISIBILITY_OPTIONS.map(option => (
										<SelectItem key={option} value={option}>
											{tOverview(PRIVACY_AUDIENCE_KEYS[option])}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					))}
				</div>

				<SaveStatus
					pending={updatePrivacy.isPending}
					saved={updatePrivacy.isSuccess}
				/>
			</CardContent>
		</Card>
	)
}
