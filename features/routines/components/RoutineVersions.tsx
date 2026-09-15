'use client'

import type { RoutineVersion, WeightUnit } from '@sunsteel/contracts'
import {
	ROUTINE_VERSION_NAME_MAX,
	ROUTINE_VERSIONS_MAX,
} from '@sunsteel/contracts'
import { GitCompare, RefreshCw, RotateCcw, Save, Trash2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import {
	useCreateRoutineVersion,
	useDeleteRoutineVersion,
	useRestoreRoutineVersion,
	useRoutineVersions,
} from '@/lib/api/hooks/useRoutineVersions'
import type { Routine } from '@/lib/api/types/routine.type'
import { formatTimeAgo } from '@/lib/utils/date'
import {
	compareRoutineSetups,
	describeSetupSize,
	describeVersionOrigin,
	restoreBlockedReason,
	routineSetup,
	versionTitle,
} from '@/lib/utils/routine-versions'

interface RoutineVersionsProps {
	routine: Routine
	/** A session of this routine is in progress: restoring is refused. */
	hasLiveSession: boolean
	weightUnit: WeightUnit
}

const DAY_STATUS_WORDS = {
	ADDED: 'New day',
	REMOVED: 'Removed day',
	CHANGED: null,
} as const

function SaveVersionDialog({
	open,
	onOpenChange,
	routineId,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	routineId: string
}) {
	const [name, setName] = useState('')
	const create = useCreateRoutineVersion(routineId)
	const { push } = useToast()

	const save = () =>
		create.mutate(name.trim() || null, {
			onSuccess: version => {
				push({
					title: 'Version saved',
					description: `${versionTitle(version)} keeps the routine as it is now.`,
					variant: 'success',
				})
				setName('')
				onOpenChange(false)
			},
			onError: error =>
				push({
					title: 'Version not saved',
					description: error.message,
					variant: 'destructive',
				}),
		})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Save a version</DialogTitle>
					<DialogDescription>
						Keeps a copy of every day, exercise, set, load and note as they are
						now. Editing the routine later does not change it.
					</DialogDescription>
				</DialogHeader>
				<form
					id="save-routine-version"
					className="space-y-2"
					onSubmit={event => {
						event.preventDefault()
						save()
					}}
				>
					<Label htmlFor="routine-version-name">Name (optional)</Label>
					<Input
						id="routine-version-name"
						value={name}
						maxLength={ROUTINE_VERSION_NAME_MAX}
						placeholder="e.g. Strength block"
						onChange={event => setName(event.target.value)}
					/>
					<p className="type-body-sm text-ink-3">
						Without a name it is numbered.
					</p>
				</form>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="save-routine-version"
						disabled={create.isPending}
					>
						{create.isPending ? 'Saving…' : 'Save version'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function CompareVersionDialog({
	version,
	onClose,
	routine,
	versionCount,
	max,
	hasLiveSession,
	weightUnit,
}: {
	version: RoutineVersion
	onClose: () => void
	routine: Routine
	versionCount: number
	max: number
	hasLiveSession: boolean
	weightUnit: WeightUnit
}) {
	const restore = useRestoreRoutineVersion(routine.id)
	const { push } = useToast()
	const title = versionTitle(version)
	const comparison = useMemo(
		() =>
			compareRoutineSetups(routineSetup(routine), version.setup, weightUnit),
		[routine, version.setup, weightUnit],
	)
	const blocked = restoreBlockedReason({
		comparison,
		versionCount,
		max,
		hasLiveSession,
	})

	const onRestore = () =>
		restore.mutate(version.id, {
			onSuccess: ({ savedVersion }) => {
				push({
					title: `${title} restored`,
					description: `The setup it replaced is saved as ${versionTitle(savedVersion)}.`,
					variant: 'success',
				})
				onClose()
			},
			onError: error =>
				push({
					title: 'Version not restored',
					description: error.message,
					variant: 'destructive',
				}),
		})

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Compare {title}</DialogTitle>
					<DialogDescription>
						What restoring it would change in the routine as it is now.
					</DialogDescription>
				</DialogHeader>

				{comparison.isEmpty ? (
					<p className="type-body-sm text-ink-2">
						This version matches the routine as it is now.
					</p>
				) : (
					<div className="space-y-4">
						{comparison.routine.length ? (
							<ul className="type-body-sm space-y-1 text-ink-2">
								{comparison.routine.map(change => (
									<li key={change}>{change}</li>
								))}
							</ul>
						) : null}
						{comparison.days.map(day => (
							<section
								key={`${day.status}-${day.title}`}
								className="rule-row space-y-1 pt-3"
							>
								<h3 className="type-panel text-foreground">
									{day.title}
									{DAY_STATUS_WORDS[day.status] ? (
										<span className="type-body-sm ml-2 text-ink-3">
											{DAY_STATUS_WORDS[day.status]}
										</span>
									) : null}
								</h3>
								<ul className="type-body-sm space-y-1 text-ink-2">
									{day.changes.map(change => (
										<li key={change}>{change}</li>
									))}
								</ul>
							</section>
						))}
					</div>
				)}

				{/* An identical version already says so above. */}
				{comparison.isEmpty ? null : (
					<p className="type-body-sm text-ink-3">
						{blocked ??
							'Restoring saves the current setup as a new version first, so you can undo it. Loads return to this version’s, undoing any automatic progression since.'}
					</p>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
					<Button
						type="button"
						onClick={onRestore}
						disabled={!!blocked || restore.isPending}
					>
						<RotateCcw aria-hidden />
						{restore.isPending ? 'Restoring…' : 'Restore this version'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/**
 * ROUT-08: saved versions of the routine, on its detail page. A version is an
 * immutable copy of the whole setup; comparing reads it against the routine
 * as it is now, and restoring first saves the current setup as a version.
 */
export function RoutineVersions({
	routine,
	hasLiveSession,
	weightUnit,
}: RoutineVersionsProps) {
	const versions = useRoutineVersions(routine.id)
	const remove = useDeleteRoutineVersion(routine.id)
	const { push } = useToast()
	const [saveOpen, setSaveOpen] = useState(false)
	const [comparing, setComparing] = useState<RoutineVersion | null>(null)
	const [deleting, setDeleting] = useState<RoutineVersion | null>(null)

	const list = versions.data?.versions ?? []
	const max = versions.data?.max ?? ROUTINE_VERSIONS_MAX
	const full = list.length >= max

	const onDelete = (version: RoutineVersion) =>
		remove.mutate(version.id, {
			onSuccess: () => {
				push({
					title: `${versionTitle(version)} deleted`,
					description: 'The routine itself did not change.',
					variant: 'success',
				})
				setDeleting(null)
			},
			onError: error =>
				push({
					title: 'Version not deleted',
					description: error.message,
					variant: 'destructive',
				}),
		})

	return (
		<section aria-labelledby="routine-versions" className="space-y-3">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div className="min-w-0 flex-1 basis-64">
					<h2 id="routine-versions" className="type-section text-foreground">
						Versions
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						Save the routine as it is now to compare or restore it later.
						{versions.data ? ` ${list.length} of ${max} kept.` : ''}
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setSaveOpen(true)}
					disabled={!versions.data || full}
				>
					<Save aria-hidden />
					Save version
				</Button>
			</div>

			{versions.isPending ? (
				<div role="status" aria-label="Loading versions" className="space-y-2">
					<Skeleton className="h-12" />
					<Skeleton className="h-12" />
				</div>
			) : versions.isError ? (
				<div role="alert" className="space-y-2">
					<p className="type-body-sm text-ink-2">
						Versions could not be loaded.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void versions.refetch()}
					>
						<RefreshCw aria-hidden />
						Retry
					</Button>
				</div>
			) : list.length === 0 ? (
				<p className="type-body-sm text-ink-3">
					No versions yet. Saving one before a bigger change keeps the current
					setup to come back to.
				</p>
			) : (
				<ul>
					{list.map(version => {
						const origin = describeVersionOrigin(version)
						return (
							<li
								key={version.id}
								className="rule-row flex flex-wrap items-center gap-2 py-3"
							>
								<div className="min-w-0 flex-1 basis-48">
									<p className="type-panel text-foreground">
										{versionTitle(version)}
									</p>
									<p className="type-body-sm text-ink-3">
										Saved {formatTimeAgo(version.createdAt)} ·{' '}
										{describeSetupSize(version.setup)}
									</p>
									{origin ? (
										<p className="type-body-sm text-ink-3">{origin}</p>
									) : null}
								</div>
								{/* The row's two controls wrap together, never one alone. */}
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setComparing(version)}
									>
										<GitCompare aria-hidden />
										Compare
									</Button>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onClick={() => setDeleting(version)}
										aria-label={`Delete ${versionTitle(version)}`}
									>
										<Trash2 aria-hidden />
										Delete
									</Button>
								</div>
							</li>
						)
					})}
				</ul>
			)}

			{full ? (
				<p className="type-body-sm text-ink-3">
					This routine keeps {max} versions. Delete one to save another.
				</p>
			) : null}

			<SaveVersionDialog
				open={saveOpen}
				onOpenChange={setSaveOpen}
				routineId={routine.id}
			/>

			{comparing ? (
				<CompareVersionDialog
					version={comparing}
					onClose={() => setComparing(null)}
					routine={routine}
					versionCount={list.length}
					max={max}
					hasLiveSession={hasLiveSession}
					weightUnit={weightUnit}
				/>
			) : null}

			<AlertDialog
				open={!!deleting}
				onOpenChange={open => !open && setDeleting(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete {deleting ? versionTitle(deleting) : 'version'}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							The routine itself does not change, but this version cannot be
							recovered.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={event => {
								// Stay open until the deletion answers.
								event.preventDefault()
								if (deleting) onDelete(deleting)
							}}
							disabled={remove.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{remove.isPending ? 'Deleting…' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
