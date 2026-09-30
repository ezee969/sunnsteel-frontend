'use client'

import type {
	RoutineTrainingBlock,
	RoutineVersion,
	WeightUnit,
} from '@sunsteel/contracts'
import {
	ROUTINE_TRAINING_BLOCK_NAME_MAX,
	ROUTINE_TRAINING_BLOCKS_MAX,
} from '@sunsteel/contracts'
import {
	Activity,
	CalendarRange,
	GitCompare,
	Pencil,
	Plus,
	RefreshCw,
	Trash2,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { RoutineSetupComparison } from '@/features/routines/components/RoutineSetupComparison'
import { TrainingBlockComparisonDialog } from '@/features/routines/components/TrainingBlockComparison'
import type { Locale } from '@/i18n/config'
import {
	useCreateRoutineTrainingBlock,
	useDeleteRoutineTrainingBlock,
	useRoutineTrainingBlockRevisions,
	useRoutineTrainingBlocks,
	useUpdateRoutineTrainingBlock,
} from '@/lib/api/hooks/useRoutineTrainingBlocks'
import { useRoutineVersions } from '@/lib/api/hooks/useRoutineVersions'
import type { Routine } from '@/lib/api/types/routine.type'
import { formatTimeAgo } from '@/lib/utils/date'
import {
	describeTrainingBlockSource,
	formatTrainingBlockRange,
	trainingBlockChangeNote,
	trainingBlockStateLabel,
} from '@/lib/utils/routine-training-blocks'
import {
	compareRoutineSetups,
	describeSetupSize,
	routineSetup,
	versionTitle,
} from '@/lib/utils/routine-versions'
import { blockComparisonAction } from '@/lib/utils/training-block-comparison'

interface RoutineTrainingBlocksProps {
	routine: Routine
	weightUnit: WeightUnit
}

const CURRENT_ROUTINE = 'current-routine'

function TrainingBlockDialog({
	block,
	routineId,
	versions,
	onClose,
}: {
	block: RoutineTrainingBlock | null
	routineId: string
	versions: RoutineVersion[]
	onClose: () => void
}) {
	const t = useTranslations('routines.trainingBlocks')
	const tVersions = useTranslations('routines.versions')
	const [name, setName] = useState(block?.name ?? '')
	const [startDate, setStartDate] = useState(block?.startDate ?? '')
	const [endDate, setEndDate] = useState(block?.endDate ?? '')
	const savedSourceStillExists = versions.some(
		version => version.id === block?.source.versionId,
	)
	const [source, setSource] = useState(
		savedSourceStillExists ? block!.source.versionId! : CURRENT_ROUTINE,
	)
	const create = useCreateRoutineTrainingBlock(routineId)
	const update = useUpdateRoutineTrainingBlock(routineId)
	const { push } = useToast()
	const isPending = create.isPending || update.isPending
	const valid =
		!!name.trim() && !!startDate && !!endDate && endDate >= startDate

	const save = () => {
		const data = {
			name: name.trim(),
			startDate,
			endDate,
			sourceVersionId: source === CURRENT_ROUTINE ? null : source,
		}
		const options = {
			onSuccess: (saved: RoutineTrainingBlock) => {
				push({
					title: block ? t('toastRevisedTitle') : t('toastAddedTitle'),
					description: block
						? t('toastRevisedDescription', {
								name: saved.name,
								revision: saved.revision,
							})
						: t('toastAddedDescription', { name: saved.name }),
					variant: 'success' as const,
				})
				onClose()
			},
			onError: (error: Error) =>
				push({
					title: block ? t('toastNotRevised') : t('toastNotAdded'),
					description: error.message,
					variant: 'destructive' as const,
				}),
		}
		if (block) update.mutate({ blockId: block.id, data }, options)
		else create.mutate(data, options)
	}

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{block ? t('reviseTitle', { name: block.name }) : t('addTitle')}
					</DialogTitle>
					<DialogDescription>{t('dialogDescription')}</DialogDescription>
				</DialogHeader>
				<form
					id="routine-training-block-form"
					className="space-y-4"
					onSubmit={event => {
						event.preventDefault()
						if (valid) save()
					}}
				>
					<div className="space-y-2">
						<Label htmlFor="training-block-name">{t('nameLabel')}</Label>
						<Input
							id="training-block-name"
							value={name}
							maxLength={ROUTINE_TRAINING_BLOCK_NAME_MAX}
							placeholder={t('namePlaceholder')}
							onChange={event => setName(event.target.value)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="training-block-start">{t('startsLabel')}</Label>
							<Input
								id="training-block-start"
								type="date"
								value={startDate}
								disabled={block?.state === 'ACTIVE'}
								onChange={event => setStartDate(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="training-block-end">{t('endsLabel')}</Label>
							<Input
								id="training-block-end"
								type="date"
								value={endDate}
								min={startDate}
								onChange={event => setEndDate(event.target.value)}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="training-block-source">{t('sourceLabel')}</Label>
						<Select value={source} onValueChange={setSource}>
							<SelectTrigger id="training-block-source" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={CURRENT_ROUTINE}>
									{t('sourceCurrent')}
								</SelectItem>
								{versions.map(version => (
									<SelectItem key={version.id} value={version.id}>
										{versionTitle(version, tVersions)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="type-body-sm text-ink-3">{t('sourceHint')}</p>
					</div>
					{block ? (
						<p className="type-body-sm text-ink-3">
							{trainingBlockChangeNote(block.state, t)}
						</p>
					) : null}
				</form>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t('cancel')}
					</Button>
					<Button
						type="submit"
						form="routine-training-block-form"
						disabled={!valid || isPending}
					>
						{isPending
							? t('saving')
							: block
								? t('createRevision')
								: t('addBlock')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function ReviewTrainingBlockDialog({
	block,
	routine,
	weightUnit,
	onClose,
}: {
	block: RoutineTrainingBlock
	routine: Routine
	weightUnit: WeightUnit
	onClose: () => void
}) {
	const locale = useLocale() as Locale
	const t = useTranslations('routines.trainingBlocks')
	const tVersions = useTranslations('routines.versions')
	const tDate = useTranslations('routines.date')
	const tSchedule = useTranslations('routines.schedule')
	const tFormat = useTranslations('routines.format')
	const revisions = useRoutineTrainingBlockRevisions(routine.id, block.id)
	const [selectedId, setSelectedId] = useState(block.id)
	const selected =
		revisions.data?.revisions.find(revision => revision.id === selectedId) ??
		block
	const comparison = useMemo(
		() =>
			compareRoutineSetups(
				routineSetup(routine),
				selected.setup,
				weightUnit,
				tVersions,
				tDate,
				tSchedule,
				tFormat,
				locale,
			),
		[routine, selected.setup, weightUnit, tVersions, tDate, tSchedule, tFormat],
	)

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t('reviewTitle', { name: block.name })}</DialogTitle>
					<DialogDescription>{t('reviewDescription')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					<p className="type-body-sm text-ink-2">
						{t('revisionSize', {
							revision: selected.revision,
							size: describeSetupSize(selected.setup, tVersions),
						})}
					</p>
					<p className="type-body-sm text-ink-3">
						{t('sourceSaved', {
							source: describeTrainingBlockSource(selected.source, t),
							time: formatTimeAgo(selected.createdAt),
						})}
					</p>
				</div>

				{revisions.isError ? (
					<p role="alert" className="type-body-sm text-destructive">
						{t('historyLoadError')}
					</p>
				) : revisions.data && revisions.data.revisions.length > 1 ? (
					<div className="space-y-2">
						<p className="type-label text-ink-3">{t('revisionHistory')}</p>
						<div className="flex flex-wrap gap-2">
							{revisions.data.revisions.map(revision => (
								<Button
									key={revision.id}
									type="button"
									variant={
										revision.id === selected.id ? 'secondary' : 'outline'
									}
									size="sm"
									onClick={() => setSelectedId(revision.id)}
								>
									{t('revisionButton', { revision: revision.revision })}
								</Button>
							))}
						</div>
					</div>
				) : null}

				<RoutineSetupComparison comparison={comparison} />

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t('close')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/**
 * ROUT-09: the authored timeline. ROUT-15 executes it: while a block covers a
 * date, that date trains the block's own working copy of its setup.
 */
export function RoutineTrainingBlocks({
	routine,
	weightUnit,
}: RoutineTrainingBlocksProps) {
	const t = useTranslations('routines.trainingBlocks')
	const tCompare = useTranslations('progress.blockComparison')
	const tVersions = useTranslations('routines.versions')
	const locale = useLocale() as Locale
	const blocks = useRoutineTrainingBlocks(routine.id)
	const versions = useRoutineVersions(routine.id)
	const remove = useDeleteRoutineTrainingBlock(routine.id)
	const { push } = useToast()
	const [editor, setEditor] = useState<RoutineTrainingBlock | 'new' | null>(
		null,
	)
	const [reviewing, setReviewing] = useState<RoutineTrainingBlock | null>(null)
	const [deleting, setDeleting] = useState<RoutineTrainingBlock | null>(null)
	const [comparing, setComparing] = useState<RoutineTrainingBlock | null>(null)
	const list = blocks.data?.blocks ?? []
	const max = blocks.data?.max ?? ROUTINE_TRAINING_BLOCKS_MAX
	const full = list.length >= max

	const onDelete = (block: RoutineTrainingBlock) =>
		remove.mutate(block.id, {
			onSuccess: () => {
				push({
					title: t('toastDeletedTitle', { name: block.name }),
					description: t('toastDeletedDescription'),
					variant: 'success',
				})
				setDeleting(null)
			},
			onError: error =>
				push({
					title: t('toastNotDeleted'),
					description: error.message,
					variant: 'destructive',
				}),
		})

	return (
		<section aria-labelledby="routine-training-blocks" className="space-y-3">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div className="min-w-0 flex-1 basis-64">
					<h2
						id="routine-training-blocks"
						className="type-section text-foreground"
					>
						{t('heading')}
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						{t('description')}
						{blocks.data
							? ` ${t('plannedCount', { count: list.length, max })}`
							: ''}
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setEditor('new')}
					disabled={!blocks.data || full}
				>
					<Plus aria-hidden />
					{t('addBlock')}
				</Button>
			</div>

			{blocks.isPending ? (
				<div role="status" aria-label={t('loading')} className="space-y-2">
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : blocks.isError ? (
				<div role="alert" className="space-y-2">
					<p className="type-body-sm text-ink-2">{t('loadError')}</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void blocks.refetch()}
					>
						<RefreshCw aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : list.length === 0 ? (
				<p className="type-body-sm text-ink-3">{t('emptyState')}</p>
			) : (
				<ul>
					{list.map(block => (
						<li
							key={block.id}
							className="rule-row flex flex-wrap items-center gap-3 py-3"
						>
							<div className="min-w-0 flex-1 basis-64">
								<div className="flex flex-wrap items-center gap-2">
									<p className="type-panel text-foreground">{block.name}</p>
									<Badge variant="outline">
										<CalendarRange aria-hidden />
										{trainingBlockStateLabel(block.state, t)}
									</Badge>
								</div>
								<p className="type-body-sm mt-1 text-ink-2">
									{formatTrainingBlockRange(
										block.startDate,
										block.endDate,
										locale,
									)}
								</p>
								<p className="type-body-sm text-ink-3">
									{describeSetupSize(block.setup, tVersions)} ·{' '}
									{describeTrainingBlockSource(block.source, t)}
									{block.revisionCount > 1
										? ` · ${t('revisionSuffix', { revision: block.revision })}`
										: ''}
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setReviewing(block)}
								>
									<GitCompare aria-hidden />
									{t('review')}
								</Button>
								{/* PROG-11: a block that has started has training to compare. */}
								{block.state !== 'FUTURE' ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setComparing(block)}
									>
										<Activity aria-hidden />
										{blockComparisonAction(tCompare)}
									</Button>
								) : null}
								{block.state !== 'COMPLETE' ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setEditor(block)}
									>
										<Pencil aria-hidden />
										{t('revise')}
									</Button>
								) : null}
								{block.state === 'FUTURE' ? (
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onClick={() => setDeleting(block)}
										aria-label={t('deleteAria', { name: block.name })}
									>
										<Trash2 aria-hidden />
										{t('deleteAction')}
									</Button>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}

			<p className="type-body-sm text-ink-3">{t('footnote')}</p>

			{editor ? (
				<TrainingBlockDialog
					key={editor === 'new' ? 'new' : editor.id}
					block={editor === 'new' ? null : editor}
					routineId={routine.id}
					versions={versions.data?.versions ?? []}
					onClose={() => setEditor(null)}
				/>
			) : null}

			{reviewing ? (
				<ReviewTrainingBlockDialog
					block={reviewing}
					routine={routine}
					weightUnit={weightUnit}
					onClose={() => setReviewing(null)}
				/>
			) : null}

			{comparing ? (
				<TrainingBlockComparisonDialog
					routineId={routine.id}
					block={comparing}
					weightUnit={weightUnit}
					onClose={() => setComparing(null)}
				/>
			) : null}

			<AlertDialog
				open={!!deleting}
				onOpenChange={open => !open && setDeleting(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t('deleteDialogTitle', {
								name: deleting?.name ?? t('deleteFallback'),
							})}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteDialogDescription')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={event => {
								event.preventDefault()
								if (deleting) onDelete(deleting)
							}}
							disabled={remove.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{remove.isPending ? t('deleting') : t('deleteBlock')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
