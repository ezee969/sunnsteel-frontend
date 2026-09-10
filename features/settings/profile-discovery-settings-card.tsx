'use client'

import type { ProfileDiscoverySettings } from '@sunsteel/contracts'
import { Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { useUpdateProfileDiscovery } from '@/lib/api/hooks/useUpdateProfileDiscovery'

interface DiscoveryField {
	key: keyof ProfileDiscoverySettings
	label: string
	description: string
}

const DISCOVERY_FIELDS: DiscoveryField[] = [
	{
		key: 'discoverableByName',
		label: 'Find me by name',
		description: 'Include your first or last name in member search.',
	},
	{
		key: 'discoverableByUsername',
		label: 'Find me by @username',
		description: 'Include your public @username in member search.',
	},
	{
		key: 'discoverableByContacts',
		label: 'Future contact matching',
		description:
			'Allow future contact matching to suggest your account. Sunnsteel does not upload or match contacts today.',
	},
]

interface ProfileDiscoverySettingsCardProps {
	settings: ProfileDiscoverySettings
}

export function ProfileDiscoverySettingsCard({
	settings,
}: ProfileDiscoverySettingsCardProps) {
	const [draft, setDraft] = useState(settings)
	const updateDiscovery = useUpdateProfileDiscovery()
	const { push } = useToast()

	useEffect(() => {
		setDraft(settings)
	}, [settings])

	const hasChanges = DISCOVERY_FIELDS.some(
		field => draft[field.key] !== settings[field.key],
	)

	const handleSave = () => {
		updateDiscovery.mutate(draft, {
			onSuccess: () => {
				push({
					title: 'Discovery updated',
					description: 'Your account discovery settings are now active.',
					variant: 'success',
				})
			},
			onError: error => {
				push({
					title: 'Could not update discovery',
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
					<Search className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>Account Discovery</CardTitle>
				</div>
				<CardDescription>
					Choose how other members can find your profile. What they can see
					after opening it is controlled by your profile privacy settings.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="divide-y divide-rule">
					{DISCOVERY_FIELDS.map(field => (
						<div
							key={field.key}
							className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 py-4 first:pt-0"
						>
							<div className="space-y-1">
								<Label htmlFor={`discovery-${field.key}`}>{field.label}</Label>
								<p className="type-body-sm text-ink-3">{field.description}</p>
							</div>
							<Label
								htmlFor={`discovery-${field.key}`}
								className="flex size-11 cursor-pointer items-center justify-center"
							>
								<Checkbox
									id={`discovery-${field.key}`}
									checked={draft[field.key]}
									disabled={updateDiscovery.isPending}
									onCheckedChange={checked =>
										setDraft(previous => ({
											...previous,
											[field.key]: checked === true,
										}))
									}
									aria-label={field.label}
									className="size-5"
								/>
							</Label>
						</div>
					))}
				</div>

				<div className="flex justify-end">
					<Button
						type="button"
						onClick={handleSave}
						disabled={!hasChanges || updateDiscovery.isPending}
					>
						{updateDiscovery.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
						) : null}
						Save Discovery
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
