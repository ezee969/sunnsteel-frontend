'use client'

import type {
	ActivityAudience,
	ActivityPreviewAudience,
	OwnActivityEntry,
	WeightUnit,
} from '@sunsteel/contracts'
import { Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
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
import { PrivacyCapNote } from '@/features/settings/privacy-cap-note'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import type { MessageKey } from '@/i18n/translator'
import {
	useActivityPreview,
	useOwnActivity,
	useSetActivityEntryAudience,
} from '@/lib/api/hooks/useActivity'
import {
	activityCapSection,
	AUDIENCE_LABELS,
	AUDIENCE_OPTIONS,
	describeActivityCap,
	describeEffectiveAudience,
	PREVIEW_AUDIENCE_LABELS,
} from '@/lib/utils/activity'
import { formatTimeAgo } from '@/lib/utils/date'

type OwnView = 'manage' | ActivityPreviewAudience

const DEFAULT_VALUE = 'DEFAULT'

const PREVIEW_NOTES = {
	FOLLOWERS: 'previewFollowersNote',
	PUBLIC: 'previewPublicNote',
} as const satisfies Record<
	ActivityPreviewAudience,
	MessageKey<'social.activityUi'>
>

function PageError({ onRetry }: { onRetry: () => void }) {
	const t = useTranslations('social.activityUi')
	return (
		<div role="alert" className="border border-rule bg-surface p-6">
			<p className="type-panel text-foreground">{t('errorTitle')}</p>
			<p className="type-body-sm mt-1 text-ink-3">{t('errorBody')}</p>
			<Button
				type="button"
				variant="outline"
				className="mt-4"
				onClick={onRetry}
			>
				<RefreshCw className="size-4" aria-hidden />
				{t('retry')}
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
	const locale = useLocale()
	const t = useTranslations('social.activityUi')
	const tActivity = useTranslations('social.activity')
	const tPrivacy = useTranslations('settings.privacyOverview')
	const setAudience = useSetActivityEntryAudience()
	const { push } = useToast()
	const { sharing } = entry
	const withdrawn = sharing.override === 'PRIVATE'
	const cap = describeActivityCap(sharing, tActivity, tPrivacy)
	const selectId = `activity-audience-${entry.id}`

	const onChange = (value: string) => {
		const audience =
			value === DEFAULT_VALUE ? null : (value as ActivityAudience)
		setAudience.mutate(
			{ entryId: entry.id, audience },
			{
				onError: error =>
					push({
						title: t('sharingFailed'),
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
						? t('withdrawn')
						: describeEffectiveAudience(sharing.effectiveAudience, tActivity)}
					{' · '}
					<time dateTime={entry.occurredAt} className="text-ink-3">
						{formatTimeAgo(entry.occurredAt, locale)}
					</time>
				</p>
				{cap ? (
					<PrivacyCapNote
						text={cap}
						section={activityCapSection(sharing)}
						className="type-body-sm mt-1 text-ink-3"
					/>
				) : null}
			</ActivityFact>
			<div className="flex items-center gap-2 sm:justify-end">
				<label htmlFor={selectId} className="sr-only">
					{t('whoCanSee')}
				</label>
				<NativeSelect
					id={selectId}
					value={sharing.override ?? DEFAULT_VALUE}
					disabled={setAudience.isPending}
					onChange={event => onChange(event.target.value)}
				>
					<option value={DEFAULT_VALUE}>
						{t('defaultOption', {
							audience: tActivity(AUDIENCE_LABELS[sharing.defaultAudience]),
						})}
					</option>
					{AUDIENCE_OPTIONS.map(audience => (
						<option key={audience} value={audience}>
							{audience === 'PRIVATE'
								? t('onlyMeWithdraw')
								: tActivity(AUDIENCE_LABELS[audience])}
						</option>
					))}
				</NativeSelect>
				{setAudience.isPending ? (
					<Loader2
						className="size-4 shrink-0 animate-spin text-ink-3"
						aria-label={t('saving')}
					/>
				) : null}
			</div>
		</li>
	)
}

function ManageList({ weightUnit }: { weightUnit: WeightUnit }) {
	const t = useTranslations('social.activityUi')
	const query = useOwnActivity()
	const entries = useMemo(
		() => query.data?.pages.flatMap(page => page.entries) ?? [],
		[query.data],
	)
	if (query.isPending) return <LoadingRows label={t('loadingYours')} />
	if (query.isError) return <PageError onRetry={() => void query.refetch()} />
	if (entries.length === 0) {
		return <EmptyModule title={t('emptyTitle')} description={t('emptyBody')} />
	}
	return (
		<>
			<ul aria-label={t('yourActivity')} className="border-t border-rule-faint">
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
					{t('showMore')}
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
	const t = useTranslations('social.activityUi')
	const tActivity = useTranslations('social.activity')
	const audienceLabel = tActivity(PREVIEW_AUDIENCE_LABELS[audience])
	const query = useActivityPreview(audience)
	const entries = useMemo(
		() => query.data?.pages.flatMap(page => page.entries) ?? [],
		[query.data],
	)
	return (
		<div className="space-y-4">
			<p role="status" className="type-body-sm max-w-[68ch] text-ink-2">
				{t(PREVIEW_NOTES[audience])}
			</p>
			{query.isPending ? (
				<LoadingRows label={t('loadingPreview')} />
			) : query.isError ? (
				<PageError onRetry={() => void query.refetch()} />
			) : entries.length === 0 ? (
				<EmptyModule
					title={t('nothing')}
					description={t('seesNone', { audience: audienceLabel })}
				/>
			) : (
				<>
					<ActivityEntryList
						entries={entries}
						weightUnit={weightUnit}
						showAuthor={false}
						label={t('asSeenBy', { audience: audienceLabel.toLowerCase() })}
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
							{t('showMore')}
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
	const t = useTranslations('social.activityUi')
	const tActivity = useTranslations('social.activity')
	const [view, setView] = useState<OwnView>('manage')
	const weightUnit = useWeightUnit()
	const options: { value: OwnView; label: string }[] = [
		{ value: 'manage', label: t('onlyMe') },
		{
			value: 'FOLLOWERS',
			label: tActivity(PREVIEW_AUDIENCE_LABELS.FOLLOWERS),
		},
		{ value: 'PUBLIC', label: tActivity(PREVIEW_AUDIENCE_LABELS.PUBLIC) },
	]
	return (
		<section aria-labelledby="activity-yours" className="space-y-4">
			<div className="rule-heading pb-4">
				<h2 id="activity-yours" className="type-section text-foreground">
					{t('yours')}
				</h2>
				<p className="type-body-sm mt-1 max-w-[68ch] text-ink-3">
					{t.rich('yoursBody', {
						note: tActivity('everyoneNote'),
						link: chunks => (
							<Link
								href="/settings/privacy#activity-sharing"
								className="text-foreground underline underline-offset-4"
							>
								{chunks}
							</Link>
						),
					})}
				</p>
			</div>

			<div className="space-y-2">
				<p id="activity-view-as" className="type-label text-ink-3">
					{t('seeItAs')}
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
