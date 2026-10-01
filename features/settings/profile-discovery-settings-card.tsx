'use client'

import type { ProfileDiscoverySettings } from '@sunsteel/contracts'
import { Loader2, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Explanation } from '@/components/layout/explanation'
import { Button } from '@/components/ui/button'
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

	const hasChanges = DISCOVERY_FIELDS.some(key => draft[key] !== settings[key])

	const handleSave = () => {
		updateDiscovery.mutate(draft, {
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
									disabled={updateDiscovery.isPending}
									onCheckedChange={checked =>
										setDraft(previous => ({
											...previous,
											[key]: checked === true,
										}))
									}
									aria-label={t(`field.${key}.label`)}
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
						{t('save')}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
