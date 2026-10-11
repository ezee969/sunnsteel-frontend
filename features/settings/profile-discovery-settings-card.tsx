'use client'

import type { ProfileDiscoverySettings } from '@sunsteel/contracts'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Explanation } from '@/components/layout/explanation'
import { SaveStatus } from '@/components/layout/save-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useUpdateProfileDiscovery } from '@/lib/api/hooks/useUpdateProfileDiscovery'

const DISCOVERY_FIELDS: Array<keyof ProfileDiscoverySettings> = [
	'discoverableByName',
	'discoverableByUsername',
	'discoverableByContacts',
]

interface ProfileDiscoverySettingsCardProps {
	settings: ProfileDiscoverySettings
}

export function ProfileDiscoverySettingsCard({
	settings,
}: ProfileDiscoverySettingsCardProps) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('settings.profileDiscovery')
	const [draft, setDraft] = useState(settings)
	const updateDiscovery = useUpdateProfileDiscovery()
	const { push } = useToast()

	useEffect(() => {
		setDraft(settings)
	}, [settings])

	// UX-26 (§28.7): a switch saves when it is flipped.
	const choose = (key: (typeof DISCOVERY_FIELDS)[number], value: boolean) => {
		if (value === draft[key]) return
		const next = { ...draft, [key]: value }
		setDraft(next)
		updateDiscovery.mutate(next, {
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
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Search className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				<Explanation summary={t('descriptionSummary')}>
					<p>{t('description')}</p>
				</Explanation>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="divide-y divide-rule">
					{DISCOVERY_FIELDS.map(key => (
						<div
							key={key}
							className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px] items-center gap-3 py-4 first:pt-0"
						>
							<div className="space-y-1">
								<Label htmlFor={`discovery-${key}`}>
									{t(`field.${key}.label`)}
								</Label>
								<p className="type-body-sm text-ink-3">
									{t(`field.${key}.description`)}
								</p>
							</div>
							<Label
								htmlFor={`discovery-${key}`}
								className="flex size-11 cursor-pointer items-center justify-center"
							>
								<Checkbox
									id={`discovery-${key}`}
									checked={draft[key]}
									onCheckedChange={checked => choose(key, checked === true)}
									aria-label={t(`field.${key}.label`)}
									className="size-5"
								/>
							</Label>
						</div>
					))}
				</div>

				<SaveStatus
					pending={updateDiscovery.isPending}
					saved={updateDiscovery.isSuccess}
				/>
			</CardContent>
		</Card>
	)
}
