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
	CalendarRange,
	GitCompare,
	Pencil,
	Plus,
	RefreshCw,
	Trash2,
} from 'lucide-react'
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
					title: block ? 'Training block revised' : 'Training block added',
					description: block
						? `${saved.name} is now revision ${saved.revision}.`
						: `${saved.name} is stored without changing the routine.`,
					variant: 'success' as const,
				})
				onClose()
			},
			onError: (error: Error) =>
				push({
					title: block
						? 'Training block not revised'
						: 'Training block not added',
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
						{block ? `Revise ${block.name}` : 'Add training block'}
					</DialogTitle>
					<DialogDescription>
						Choose the dates and copy a setup into this plan. The routine,
						schedule and sessions do not switch automatically.
					</DialogDescription>
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
						<Label htmlFor="training-block-name">Name</Label>
						<Input
							id="training-block-name"
							value={name}
							maxLength={ROUTINE_TRAINING_BLOCK_NAME_MAX}
							placeholder="e.g. Accumulation"
							onChange={event => setName(event.target.value)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="training-block-start">Starts</Label>
							<Input
								id="training-block-start"
								type="date"
								value={startDate}
								disabled={block?.state === 'ACTIVE'}
								onChange={event => setStartDate(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="training-block-end">Ends</Label>
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
						<Label htmlFor="training-block-source">Setup source</Label>
						<Select value={source} onValueChange={setSource}>
							<SelectTrigger id="training-block-source" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={CURRENT_ROUTINE}>
									Routine as it is now
								</SelectItem>
								{versions.map(version => (
									<SelectItem key={version.id} value={version.id}>
										{versionTitle(version)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="type-body-sm text-ink-3">
							The copied setup remains unchanged if its source changes or is
							deleted.
						</p>
					</div>
					{block ? (
						<p className="type-body-sm text-ink-3">
							{trainingBlockChangeNote(block.state)}
						</p>
					) : null}
				</form>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						form="routine-training-block-form"
						disabled={!valid || isPending}
					>
						{isPending ? 'Saving…' : block ? 'Create revision' : 'Add block'}
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
	const revisions = useRoutineTrainingBlockRevisions(routine.id, block.id)
	const [selectedId, setSelectedId] = useState(block.id)
	const selected =
		revisions.data?.revisions.find(revision => revision.id === selectedId) ??
		block
	const comparison = useMemo(
		() =>
			compareRoutineSetups(routineSetup(routine), selected.setup, weightUnit),
		[routine, selected.setup, weightUnit],
	)

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Review {block.name}</DialogTitle>
					<DialogDescription>
						Exact differences between this captured setup and the routine as it
						is now.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					<p className="type-body-sm text-ink-2">
						Revision {selected.revision} · {describeSetupSize(selected.setup)}
					</p>
					<p className="type-body-sm text-ink-3">
						{describeTrainingBlockSource(selected.source)} · saved{' '}
						{formatTimeAgo(selected.createdAt)}
					</p>
				</div>

				{revisions.isError ? (
					<p role="alert" className="type-body-sm text-destructive">
						Revision history could not be loaded. The current setup is still
						shown.
					</p>
				) : revisions.data && revisions.data.revisions.length > 1 ? (
					<div className="space-y-2">
						<p className="type-label text-ink-3">Revision history</p>
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
									Revision {revision.revision}
								</Button>
							))}
						</div>
					</div>
				) : null}

				<RoutineSetupComparison comparison={comparison} />

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/** ROUT-09: the authored timeline. ROUT-15 will decide when it executes. */
export function RoutineTrainingBlocks({
	routine,
	weightUnit,
}: RoutineTrainingBlocksProps) {
	const blocks = useRoutineTrainingBlocks(routine.id)
	const versions = useRoutineVersions(routine.id)
	const remove = useDeleteRoutineTrainingBlock(routine.id)
	const { push } = useToast()
	const [editor, setEditor] = useState<RoutineTrainingBlock | 'new' | null>(
		null,
	)
	const [reviewing, setReviewing] = useState<RoutineTrainingBlock | null>(null)
	const [deleting, setDeleting] = useState<RoutineTrainingBlock | null>(null)
	const list = blocks.data?.blocks ?? []
	const max = blocks.data?.max ?? ROUTINE_TRAINING_BLOCKS_MAX
	const full = list.length >= max

	const onDelete = (block: RoutineTrainingBlock) =>
		remove.mutate(block.id, {
			onSuccess: () => {
				push({
					title: `${block.name} deleted`,
					description: 'Its plan was removed. The routine did not change.',
					variant: 'success',
				})
				setDeleting(null)
			},
			onError: error =>
				push({
					title: 'Training block not deleted',
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
						Training blocks
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						Plan dated setups without changing the editable routine, schedule or
						sessions.
						{blocks.data ? ` ${list.length} of ${max} planned.` : ''}
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
					Add block
				</Button>
			</div>

			{blocks.isPending ? (
				<div
					role="status"
					aria-label="Loading training blocks"
					className="space-y-2"
				>
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : blocks.isError ? (
				<div role="alert" className="space-y-2">
					<p className="type-body-sm text-ink-2">
						Training blocks could not be loaded.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void blocks.refetch()}
					>
						<RefreshCw aria-hidden />
						Retry
					</Button>
				</div>
			) : list.length === 0 ? (
				<p className="type-body-sm text-ink-3">
					No blocks yet. Add a dated copy of the current routine or a saved
					version.
				</p>
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
										{trainingBlockStateLabel(block.state)}
									</Badge>
								</div>
								<p className="type-body-sm mt-1 text-ink-2">
									{formatTrainingBlockRange(block.startDate, block.endDate)}
								</p>
								<p className="type-body-sm text-ink-3">
									{describeSetupSize(block.setup)} ·{' '}
									{describeTrainingBlockSource(block.source)}
									{block.revisionCount > 1
										? ` · revision ${block.revision}`
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
									Review
								</Button>
								{block.state !== 'COMPLETE' ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setEditor(block)}
									>
										<Pencil aria-hidden />
										Revise
									</Button>
								) : null}
								{block.state === 'FUTURE' ? (
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onClick={() => setDeleting(block)}
										aria-label={`Delete ${block.name}`}
									>
										<Trash2 aria-hidden />
										Delete
									</Button>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}

			<p className="type-body-sm text-ink-3">
				Execution remains on the routine’s current setup until phase-aware
				training ships.
			</p>

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

			<AlertDialog
				open={!!deleting}
				onOpenChange={open => !open && setDeleting(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete {deleting?.name ?? 'training block'}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This removes every revision of this future plan. The routine
							itself does not change.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={event => {
								event.preventDefault()
								if (deleting) onDelete(deleting)
							}}
							disabled={remove.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{remove.isPending ? 'Deleting…' : 'Delete block'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
