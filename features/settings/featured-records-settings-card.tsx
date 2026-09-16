'use client'

import {
	FEATURED_PROFILE_ITEMS_MAX,
	type FeaturedProfileSelection,
	type PersonalRecordEntry,
	type WeightUnit,
} from '@sunsteel/contracts'
import {
	ArrowDown,
	ArrowUp,
	Bookmark,
	Loader2,
	Plus,
	Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import {
	useFeaturedProfileItems,
	useReplaceFeaturedProfileItems,
} from '@/lib/api/hooks/useFeaturedProfileItems'
import { usePublicUser } from '@/lib/api/hooks/usePublicUser'
import {
	addFeaturedRecord,
	buildFeaturedProfileRequest,
	featuredProfileSelectionKey,
	moveFeaturedProfileItem,
	removeFeaturedProfileItem,
} from '@/lib/utils/featured-profile-items'
import { formatWeight } from '@/lib/utils/weight-unit'

interface FeaturedRecordsSettingsCardProps {
	username: string
	weightUnit: WeightUnit
}

const EMPTY_RECORDS: PersonalRecordEntry[] = []

function recordSummary(record: PersonalRecordEntry, weightUnit: WeightUnit) {
	return `${formatWeight(record.weight, weightUnit)} × ${record.reps} · est. 1RM ${formatWeight(record.estimated1rm, weightUnit)}`
}

export function FeaturedRecordsSettingsCard({
	username,
	weightUnit,
}: FeaturedRecordsSettingsCardProps) {
	const selectionsQuery = useFeaturedProfileItems()
	const profileQuery = usePublicUser(username)
	const replaceItems = useReplaceFeaturedProfileItems()
	const { push } = useToast()
	const [drafts, setDrafts] = useState<FeaturedProfileSelection[]>([])

	useEffect(() => {
		if (selectionsQuery.data) setDrafts(selectionsQuery.data.items)
	}, [selectionsQuery.data])

	const records = profileQuery.data?.personalRecords ?? EMPTY_RECORDS
	const recordsById = useMemo(
		() => new Map(records.map(record => [record.exerciseId, record])),
		[records],
	)
	const selectedKeys = new Set(drafts.map(featuredProfileSelectionKey))
	const availableRecords = records.filter(
		record => !selectedKeys.has(`RECORD:${record.exerciseId}`),
	)
	const savedKeys =
		selectionsQuery.data?.items.map(featuredProfileSelectionKey).join('|') ?? ''
	const draftKeys = drafts.map(featuredProfileSelectionKey).join('|')
	const hasChanges = savedKeys !== draftKeys
	const isLoading = selectionsQuery.isLoading || profileQuery.isLoading
	const error = selectionsQuery.error ?? profileQuery.error

	const save = () => {
		replaceItems.mutate(buildFeaturedProfileRequest(drafts), {
			onSuccess: () => {
				push({
					title: 'Featured profile saved',
					description: 'Your profile now uses this accomplishment order.',
					variant: 'success',
				})
			},
			onError: mutationError => {
				push({
					title: 'Could not save featured records',
					description: mutationError.message,
					variant: 'destructive',
				})
			},
		})
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Bookmark className="size-5 text-ink-3" aria-hidden />
					<CardTitle>Featured Accomplishments</CardTitle>
				</div>
				<CardDescription>
					Choose and order up to {FEATURED_PROFILE_ITEMS_MAX} current records.
					They follow your Personal Records privacy setting. Achievement and
					rank selection will use these same slots when available.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				{isLoading ? (
					<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Loading featured accomplishments…
					</div>
				) : error ? (
					<div
						role="alert"
						className="border border-destructive bg-surface p-4"
					>
						<p className="type-body-sm text-destructive">{error.message}</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => {
								void selectionsQuery.refetch()
								void profileQuery.refetch()
							}}
						>
							Try Again
						</Button>
					</div>
				) : (
					<>
						<div>
							<p className="type-label border-b border-rule pb-2 text-ink-3">
								Profile order
							</p>
							{drafts.length ? (
								<div>
									{drafts.map((item, index) => {
										const record =
											item.kind === 'RECORD'
												? recordsById.get(item.referenceId)
												: undefined
										const title =
											record?.exerciseName ??
											(item.kind === 'ACHIEVEMENT'
												? 'Featured achievement'
												: item.kind === 'RANK'
													? 'Featured rank'
													: 'Record no longer available')
										return (
											<div
												key={featuredProfileSelectionKey(item)}
												className="rule-row grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
											>
												<div className="min-w-0">
													<p className="type-panel text-foreground">{title}</p>
													<p className="type-body-sm text-ink-3">
														{record
															? recordSummary(record, weightUnit)
															: item.kind === 'RECORD'
																? 'Remove this stale reference before saving.'
																: `Managed by the ${item.kind === 'RANK' ? 'rank' : 'achievement'} picker.`}
													</p>
												</div>
												<div className="flex items-center gap-1">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={`Move ${title} up`}
														disabled={index === 0}
														onClick={() =>
															setDrafts(current =>
																moveFeaturedProfileItem(
																	current,
																	index,
																	index - 1,
																),
															)
														}
													>
														<ArrowUp className="size-4" aria-hidden />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={`Move ${title} down`}
														disabled={index === drafts.length - 1}
														onClick={() =>
															setDrafts(current =>
																moveFeaturedProfileItem(
																	current,
																	index,
																	index + 1,
																),
															)
														}
													>
														<ArrowDown className="size-4" aria-hidden />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={`Remove ${title}`}
														onClick={() =>
															setDrafts(current =>
																removeFeaturedProfileItem(
																	current,
																	featuredProfileSelectionKey(item),
																),
															)
														}
													>
														<Trash2
															className="size-4 text-destructive"
															aria-hidden
														/>
													</Button>
												</div>
											</div>
										)
									})}
								</div>
							) : (
								<p className="type-body-sm py-4 text-ink-3">
									No featured accomplishments yet.
								</p>
							)}
						</div>

						{availableRecords.length ? (
							<div>
								<p className="type-label border-b border-rule pb-2 text-ink-3">
									Available records
								</p>
								{availableRecords.map(record => (
									<div
										key={record.exerciseId}
										className="rule-row flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<p className="type-panel text-foreground">
												{record.exerciseName}
											</p>
											<p className="type-body-sm text-ink-3">
												{recordSummary(record, weightUnit)}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={drafts.length >= FEATURED_PROFILE_ITEMS_MAX}
											onClick={() =>
												setDrafts(current =>
													addFeaturedRecord(current, record.exerciseId),
												)
											}
										>
											<Plus className="size-4" aria-hidden /> Feature
										</Button>
									</div>
								))}
							</div>
						) : records.length === 0 ? (
							<p className="type-body-sm text-ink-3">
								Complete logged sets to establish records you can feature.
							</p>
						) : null}

						<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
							<p className="type-body-sm text-ink-3">
								{drafts.length}/{FEATURED_PROFILE_ITEMS_MAX} slots used
							</p>
							<Button
								type="button"
								onClick={save}
								disabled={!hasChanges || replaceItems.isPending}
							>
								{replaceItems.isPending ? (
									<Loader2 className="size-4 animate-spin" aria-hidden />
								) : null}
								Save Featured Items
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
