'use client'

import type {
	ProfilePrivacySettings,
	ProfileVisibility,
} from '@sunsteel/contracts'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
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
	const t = useTranslations('settings.profilePrivacy')
	const tOverview = useTranslations('settings.privacyOverview')
	const [draft, setDraft] = useState(settings)
	const updatePrivacy = useUpdateProfilePrivacy()
	const { push } = useToast()

	useEffect(() => {
		setDraft(settings)
	}, [settings])

	const hasChanges = PRIVACY_FIELDS.some(key => draft[key] !== settings[key])

	const handleSave = () => {
		updatePrivacy.mutate(draft, {
			onSuccess: () => {
				push({
					title: t('updatedTitle'),
					description: t('updatedDescription'),
					variant: 'success',
				})
			},
			onError: error => {
				push({
					title: t('failedTitle'),
					description: error.message,
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
								onValueChange={value =>
									setDraft(previous => ({
										...previous,
										[key]: value as ProfileVisibility,
									}))
								}
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

				<div className="flex justify-end">
					<Button
						type="button"
						onClick={handleSave}
						disabled={!hasChanges || updatePrivacy.isPending}
					>
						{updatePrivacy.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
						) : null}
						{t('save')}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
