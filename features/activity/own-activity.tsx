'use client'

import type {
	ActivityAudience,
	ActivityPreviewAudience,
	OwnActivityEntry,
	WeightUnit,
} from '@sunsteel/contracts'
import { Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import {
	ActivityEntryList,
	ActivityFact,
} from '@/features/activity/activity-entry-list'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	useActivityPreview,
	useOwnActivity,
	useSetActivityEntryAudience,
} from '@/lib/api/hooks/useActivity'
import {
	ACTIVITY_EVERYONE_NOTE,
	AUDIENCE_LABELS,
	AUDIENCE_OPTIONS,
	describeActivityCap,
	describeEffectiveAudience,
	PREVIEW_AUDIENCE_LABELS,
} from '@/lib/utils/activity'
import { formatTimeAgo } from '@/lib/utils/date'

type OwnView = 'manage' | ActivityPreviewAudience

const DEFAULT_VALUE = 'DEFAULT'

const PREVIEW_NOTES: Record<ActivityPreviewAudience, string> = {
	FOLLOWERS:
		'A member who follows you sees exactly this, in their feed and on your profile.',
	PUBLIC:
		'Any other signed-in member sees exactly this on your profile. It never reaches their feed, which shows only members they follow.',
}

function PageError({ onRetry }: { onRetry: () => void }) {
	return (
		<div role="alert" className="border border-rule bg-surface p-6">
			<p className="type-panel text-foreground">Activity is unavailable</p>
			<p className="type-body-sm mt-1 text-ink-3">
				We could not load it. Try again.
			</p>
			<Button
				type="button"
				variant="outline"
				className="mt-4"
				onClick={onRetry}
			>
				<RefreshCw className="size-4" aria-hidden />
				Retry
			</Button>
		</div>
	)
}

function LoadingRows({ label }: { label: string }) {
	return (
		<div className="space-y-3" aria-label={label}>
			<Skeleton className="h-20" />
			<Skeleton className="h-20" />
			<Skeleton className="h-20" />
		</div>
	)
}

/**
 * SOC-04: one of the owner's entries with who can see it. The control is
 * repeated on every row, so it is a plain select rather than a primary
 * (§4.3 rule 1), and the row always states the audience that took effect,
 * naming what capped it rather than letting a wider choice look honoured.
 */
function OwnActivityRow({
	entry,
	weightUnit,
}: {
	entry: OwnActivityEntry
	weightUnit: WeightUnit
}) {
	const setAudience = useSetActivityEntryAudience()
	const { push } = useToast()
	const { sharing } = entry
	const withdrawn = sharing.override === 'PRIVATE'
	const cap = describeActivityCap(sharing)
	const selectId = `activity-audience-${entry.id}`

	const onChange = (value: string) => {
		const audience =
			value === DEFAULT_VALUE ? null : (value as ActivityAudience)
		setAudience.mutate(
			{ entryId: entry.id, audience },
			{
				onError: error =>
					push({
						title: 'Sharing not changed',
						description: error.message,
						variant: 'destructive',
					}),
			},
		)
	}

	return (
		<li className="rule-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-start sm:gap-6">
			<ActivityFact entry={entry} weightUnit={weightUnit}>
				<p className="type-body-sm mt-1 text-ink-2">
					{withdrawn
						? 'Withdrawn. Only you can see this.'
						: describeEffectiveAudience(sharing.effectiveAudience)}
					{' · '}
					<time dateTime={entry.occurredAt} className="text-ink-3">
						{formatTimeAgo(entry.occurredAt)}
					</time>
				</p>
				{cap ? <p className="type-body-sm mt-1 text-ink-3">{cap}</p> : null}
			</ActivityFact>
			<div className="flex items-center gap-2 sm:justify-end">
				<label htmlFor={selectId} className="sr-only">
					Who can see this
				</label>
				<NativeSelect
					id={selectId}
					value={sharing.override ?? DEFAULT_VALUE}
					disabled={setAudience.isPending}
					onChange={event => onChange(event.target.value)}
				>
					<option value={DEFAULT_VALUE}>
						Default: {AUDIENCE_LABELS[sharing.defaultAudience]}
					</option>
					{AUDIENCE_OPTIONS.map(audience => (
						<option key={audience} value={audience}>
							{audience === 'PRIVATE'
								? 'Only me (withdraw)'
								: AUDIENCE_LABELS[audience]}
						</option>
					))}
				</NativeSelect>
				{setAudience.isPending ? (
					<Loader2
						className="size-4 shrink-0 animate-spin text-ink-3"
						aria-label="Saving"
					/>
				) : null}
			</div>
		</li>
	)
}

function ManageList({ weightUnit }: { weightUnit: WeightUnit }) {
	const query = useOwnActivity()
	const entries = useMemo(
		() => query.data?.pages.flatMap(page => page.entries) ?? [],
		[query.data],
	)
	if (query.isPending) return <LoadingRows label="Loading your activity" />
	if (query.isError) return <PageError onRetry={() => void query.refetch()} />
	if (entries.length === 0) {
		return (
			<EmptyModule
				title="No activity yet"
				description="Finished workouts, new records, load progressions, achievements, streaks, comebacks and routines you share appear here, with who can see each one."
			/>
		)
	}
	return (
		<>
			<ul aria-label="Your activity" className="border-t border-rule-faint">
				{entries.map(entry => (
					<OwnActivityRow
						key={entry.id}
						entry={entry}
						weightUnit={weightUnit}
					/>
				))}
			</ul>
			{query.hasNextPage ? (
				<Button
					type="button"
					variant="outline"
					onClick={() => void query.fetchNextPage()}
					disabled={query.isFetchingNextPage}
				>
					{query.isFetchingNextPage ? (
						<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
					) : null}
					Show more
				</Button>
			) : null}
		</>
	)
}

function AudiencePreview({
	audience,
	weightUnit,
}: {
	audience: ActivityPreviewAudience
	weightUnit: WeightUnit
}) {
	const query = useActivityPreview(audience)
	const entries = useMemo(
		() => query.data?.pages.flatMap(page => page.entries) ?? [],
		[query.data],
	)
	return (
		<div className="space-y-4">
			<p role="status" className="type-body-sm max-w-[68ch] text-ink-2">
				{PREVIEW_NOTES[audience]}
			</p>
			{query.isPending ? (
				<LoadingRows label="Loading preview" />
			) : query.isError ? (
				<PageError onRetry={() => void query.refetch()} />
			) : entries.length === 0 ? (
				<EmptyModule
					title="Nothing"
					description={`${PREVIEW_AUDIENCE_LABELS[audience]} sees none of your activity.`}
				/>
			) : (
				<>
					<ActivityEntryList
						entries={entries}
						weightUnit={weightUnit}
						showAuthor={false}
						label={`Your activity as ${PREVIEW_AUDIENCE_LABELS[audience].toLowerCase()} sees it`}
					/>
					{query.hasNextPage ? (
						<Button
							type="button"
							variant="outline"
							onClick={() => void query.fetchNextPage()}
							disabled={query.isFetchingNextPage}
						>
							{query.isFetchingNextPage ? (
								<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
							) : null}
							Show more
						</Button>
					) : null}
				</>
			)}
		</div>
	)
}

/**
 * SOC-04: the owner's activity, with a per-entry audience, and the same list
 * as a follower and as any other member would receive it.
 */
export function OwnActivity() {
	const [view, setView] = useState<OwnView>('manage')
	const weightUnit = useWeightUnit()
	const options: { value: OwnView; label: string }[] = [
		{ value: 'manage', label: 'Only me' },
		{ value: 'FOLLOWERS', label: PREVIEW_AUDIENCE_LABELS.FOLLOWERS },
		{ value: 'PUBLIC', label: PREVIEW_AUDIENCE_LABELS.PUBLIC },
	]
	return (
		<section aria-labelledby="activity-yours" className="space-y-4">
			<div className="rule-heading pb-4">
				<h2 id="activity-yours" className="type-section text-foreground">
					Yours
				</h2>
				<p className="type-body-sm mt-1 max-w-[68ch] text-ink-3">
					Choose who sees each entry, or withdraw one. Defaults for each kind
					are in{' '}
					<Link
						href="/settings#activity-sharing"
						className="text-foreground underline underline-offset-4"
					>
						Settings
					</Link>
					. {ACTIVITY_EVERYONE_NOTE}
				</p>
			</div>

			<div className="space-y-2">
				<p id="activity-view-as" className="type-label text-ink-3">
					See it as
				</p>
				<div
					role="group"
					aria-labelledby="activity-view-as"
					className="flex flex-wrap gap-1"
				>
					{options.map(option => (
						<Button
							key={option.value}
							type="button"
							size="sm"
							variant={view === option.value ? 'secondary' : 'ghost'}
							aria-pressed={view === option.value}
							onClick={() => setView(option.value)}
						>
							{option.label}
						</Button>
					))}
				</div>
			</div>

			{view === 'manage' ? (
				<ManageList weightUnit={weightUnit} />
			) : (
				<AudiencePreview audience={view} weightUnit={weightUnit} />
			)}
		</section>
	)
}
