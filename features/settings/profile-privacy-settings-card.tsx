'use client'

import type {
	ProfilePrivacySettings,
	ProfileVisibility,
} from '@sunsteel/contracts'
import { Loader2, ShieldCheck } from 'lucide-react'
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

interface PrivacyField {
	key: keyof ProfilePrivacySettings
	label: string
	description: string
}

const PRIVACY_FIELDS: PrivacyField[] = [
	{
		key: 'biography',
		label: 'Biography',
		description: 'Controls the biography shown in the About section.',
	},
	{
		key: 'location',
		label: 'Location',
		description: 'Controls the location shown in the About section.',
	},
	{
		key: 'workoutHistory',
		label: 'Workout history',
		description:
			'Controls your completed workout count, total volume, and streak summary.',
	},
	{
		key: 'records',
		label: 'Personal records',
		description: 'Controls the personal records shown on your profile.',
	},
	{
		key: 'bodyMetrics',
		label: 'Body metrics',
		description:
			'Controls age, sex, weight, and height. Your email is never shared.',
	},
	{
		key: 'routines',
		label: 'Routines',
		description:
			'Saves who may see routines when profile routine sharing becomes available.',
	},
	{
		key: 'achievements',
		label: 'Achievements',
		description:
			'Saves who may see achievements when profile achievements become available.',
	},
]

const VISIBILITY_OPTIONS: Array<{
	value: ProfileVisibility
	label: string
}> = [
	{ value: 'PRIVATE', label: 'Only me' },
	{ value: 'FOLLOWERS', label: 'Followers' },
	{ value: 'PUBLIC', label: 'Everyone' },
]

interface ProfilePrivacySettingsCardProps {
	settings: ProfilePrivacySettings
}

export function ProfilePrivacySettingsCard({
	settings,
}: ProfilePrivacySettingsCardProps) {
	const [draft, setDraft] = useState(settings)
	const updatePrivacy = useUpdateProfilePrivacy()
	const { push } = useToast()

	useEffect(() => {
		setDraft(settings)
	}, [settings])

	const hasChanges = PRIVACY_FIELDS.some(
		field => draft[field.key] !== settings[field.key],
	)

	const handleSave = () => {
		updatePrivacy.mutate(draft, {
			onSuccess: () => {
				push({
					title: 'Privacy updated',
					description: 'Your profile visibility settings are now active.',
					variant: 'success',
				})
			},
			onError: error => {
				push({
					title: 'Could not update privacy',
					description: error.message,
					variant: 'destructive',
				})
			},
		})
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>Profile Privacy</CardTitle>
				</div>
				<CardDescription>
					Choose who can see each part of your profile. New accounts start
					private.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="divide-y divide-rule">
					{PRIVACY_FIELDS.map(field => (
						<div
							key={field.key}
							className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"
						>
							<div className="space-y-1">
								<Label htmlFor={`privacy-${field.key}`}>{field.label}</Label>
								<p className="type-body-sm text-ink-3">{field.description}</p>
							</div>
							<Select
								value={draft[field.key]}
								onValueChange={value =>
									setDraft(previous => ({
										...previous,
										[field.key]: value as ProfileVisibility,
									}))
								}
							>
								<SelectTrigger id={`privacy-${field.key}`} className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{VISIBILITY_OPTIONS.map(option => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
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
						Save Privacy
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
