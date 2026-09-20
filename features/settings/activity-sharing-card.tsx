'use client'

import {
	ACTIVITY_TYPE_SECTIONS,
	ACTIVITY_TYPES,
	type ActivityAudience,
	type ActivitySharingSettings,
	type ActivityType,
} from '@sunsteel/contracts'
import { Loader2, Rss } from 'lucide-react'
import Link from 'next/link'
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
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import {
	useActivitySharing,
	useUpdateActivitySharing,
} from '@/lib/api/hooks/useActivity'
import {
	ACTIVITY_DEFAULTS_NOTE,
	ACTIVITY_EVERYONE_NOTE,
	ACTIVITY_TYPE_DESCRIPTIONS,
	ACTIVITY_TYPE_LABELS,
	AUDIENCE_LABELS,
	AUDIENCE_OPTIONS,
	describeSectionCap,
} from '@/lib/utils/activity'

type Defaults = ActivitySharingSettings['defaults']

/**
 * SOC-04: a default audience per kind of activity. It is a draft saved in one
 * step, like profile privacy, because a default reaches past entries too and
 * should be a deliberate act rather than a side effect of browsing a select.
 */
export function ActivitySharingCard() {
	const sharing = useActivitySharing()
	const update = useUpdateActivitySharing()
	const { push } = useToast()
	const [draft, setDraft] = useState<Defaults | null>(null)

	useEffect(() => {
		if (sharing.data) setDraft(sharing.data.defaults)
	}, [sharing.data])

	const changed = ACTIVITY_TYPES.filter(
		type =>
			draft && sharing.data && draft[type] !== sharing.data.defaults[type],
	)

	const save = () => {
		if (!draft || changed.length === 0) return
		update.mutate(
			{
				defaults: Object.fromEntries(
					changed.map(type => [type, draft[type]]),
				) as Partial<Record<ActivityType, ActivityAudience>>,
			},
			{
				onSuccess: () =>
					push({
						title: 'Activity sharing updated',
						description: 'Each kind now reaches the audience shown.',
						variant: 'success',
					}),
				onError: error =>
					push({
						title: 'Could not update activity sharing',
						description: error.message,
						variant: 'destructive',
					}),
			},
		)
	}

	return (
		<Card id="activity-sharing">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Rss className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>Activity Sharing</CardTitle>
				</div>
				<CardDescription>
					Who sees each kind of activity you generate by training. Nothing is
					posted by hand.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<p className="type-body-sm max-w-[68ch] text-ink-2">
						{ACTIVITY_DEFAULTS_NOTE}
					</p>
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{ACTIVITY_EVERYONE_NOTE}
					</p>
				</div>

				{sharing.isPending || !draft ? (
					sharing.isError ? (
						<div role="alert" className="space-y-3">
							<p className="type-body-sm text-ink-2">
								Activity sharing could not be loaded.
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void sharing.refetch()}
							>
								Retry
							</Button>
						</div>
					) : (
						<div className="space-y-3" aria-label="Loading activity sharing">
							<Skeleton className="h-12" />
							<Skeleton className="h-12" />
							<Skeleton className="h-12" />
						</div>
					)
				) : (
					<div className="divide-y divide-rule">
						{ACTIVITY_TYPES.map(type => {
							const section = ACTIVITY_TYPE_SECTIONS[type]
							const cap = describeSectionCap(
								section,
								sharing.data!.sections[section],
								draft[type],
							)
							const id = `activity-default-${type}`
							return (
								<div
									key={type}
									className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-start"
								>
									<div className="space-y-1">
										<Label htmlFor={id}>{ACTIVITY_TYPE_LABELS[type]}</Label>
										<p className="type-body-sm text-ink-3">
											{ACTIVITY_TYPE_DESCRIPTIONS[type]}
										</p>
										{cap ? (
											<p className="type-body-sm text-ink-2">{cap}</p>
										) : null}
									</div>
									<NativeSelect
										id={id}
										value={draft[type]}
										onChange={event =>
											setDraft(current =>
												current
													? {
															...current,
															[type]: event.target.value as ActivityAudience,
														}
													: current,
											)
										}
									>
										{AUDIENCE_OPTIONS.map(audience => (
											<option key={audience} value={audience}>
												{AUDIENCE_LABELS[audience]}
											</option>
										))}
									</NativeSelect>
								</div>
							)
						})}
					</div>
				)}

				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button asChild variant="outline" size="sm">
						<Link href="/activity?view=yours">Review each entry</Link>
					</Button>
					<Button
						type="button"
						onClick={save}
						disabled={changed.length === 0 || update.isPending}
					>
						{update.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
						) : null}
						Save Sharing
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
