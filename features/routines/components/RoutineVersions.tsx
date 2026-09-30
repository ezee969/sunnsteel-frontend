'use client'

import type { RoutineVersion, WeightUnit } from '@sunsteel/contracts'
import {
	ROUTINE_VERSION_NAME_MAX,
	ROUTINE_VERSIONS_MAX,
} from '@sunsteel/contracts'
import { GitCompare, RefreshCw, RotateCcw, Save, Trash2 } from 'lucide-react'
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
import { RoutineSetupComparison } from '@/features/routines/components/RoutineSetupComparison'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
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

function SaveVersionDialog({
	open,
	onOpenChange,
	routineId,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	routineId: string
}) {
	const errorText = useApiErrorMessage()
	const t = useTranslations('routines.versions')
	const [name, setName] = useState('')
	const create = useCreateRoutineVersion(routineId)
	const { push } = useToast()

	const save = () =>
		create.mutate(name.trim() || null, {
			onSuccess: version => {
				push({
					title: t('toastSavedTitle'),
					description: t('toastSavedDescription', {
						title: versionTitle(version, t),
					}),
					variant: 'success',
				})
				setName('')
				onOpenChange(false)
			},
			onError: error =>
				push({
					title: t('toastSaveFailedTitle'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t('saveDialogTitle')}</DialogTitle>
					<DialogDescription>{t('saveDialogDescription')}</DialogDescription>
				</DialogHeader>
				<form
					id="save-routine-version"
					className="space-y-2"
					onSubmit={event => {
						event.preventDefault()
						save()
					}}
				>
					<Label htmlFor="routine-version-name">{t('nameLabel')}</Label>
					<Input
						id="routine-version-name"
						value={name}
						maxLength={ROUTINE_VERSION_NAME_MAX}
						placeholder={t('namePlaceholder')}
						onChange={event => setName(event.target.value)}
					/>
					<p className="type-body-sm text-ink-3">{t('unnamedHint')}</p>
				</form>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t('cancel')}
					</Button>
					<Button
						type="submit"
						form="save-routine-version"
						disabled={create.isPending}
					>
						{create.isPending ? t('saving') : t('saveVersion')}
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
	const errorText = useApiErrorMessage()
	const locale = useLocale() as Locale
	const t = useTranslations('routines.versions')
	const tDate = useTranslations('routines.date')
	const tSchedule = useTranslations('routines.schedule')
	const tFormat = useTranslations('routines.format')
	const restore = useRestoreRoutineVersion(routine.id)
	const { push } = useToast()
	const title = versionTitle(version, t)
	const comparison = useMemo(
		() =>
			compareRoutineSetups(
				routineSetup(routine),
				version.setup,
				weightUnit,
				t,
				tDate,
				tSchedule,
				tFormat,
				locale,
			),
		[routine, version.setup, weightUnit, t, tDate, tSchedule, tFormat, locale],
	)
	const blocked = restoreBlockedReason({
		comparison,
		versionCount,
		max,
		hasLiveSession,
		t,
	})

	const onRestore = () =>
		restore.mutate(version.id, {
			onSuccess: ({ savedVersion }) => {
				push({
					title: t('toastRestoredTitle', { title }),
					description: t('toastRestoredDescription', {
						version: versionTitle(savedVersion, t),
					}),
					variant: 'success',
				})
				onClose()
			},
			onError: error =>
				push({
					title: t('toastRestoreFailedTitle'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t('compareDialogTitle', { title })}</DialogTitle>
					<DialogDescription>{t('compareDialogDescription')}</DialogDescription>
				</DialogHeader>

				<RoutineSetupComparison comparison={comparison} />

				{/* An identical version already says so above. */}
				{comparison.isEmpty ? null : (
					<p className="type-body-sm text-ink-3">
						{blocked ?? t('restoreDefaultNote')}
					</p>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t('close')}
					</Button>
					<Button
						type="button"
						onClick={onRestore}
						disabled={!!blocked || restore.isPending}
					>
						<RotateCcw aria-hidden />
						{restore.isPending ? t('restoring') : t('restoreThisVersion')}
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
	const errorText = useApiErrorMessage()
	const locale = useLocale()
	const t = useTranslations('routines.versions')
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
					title: t('toastDeletedTitle', { title: versionTitle(version, t) }),
					description: t('toastDeletedDescription'),
					variant: 'success',
				})
				setDeleting(null)
			},
			onError: error =>
				push({
					title: t('toastDeleteFailedTitle'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})

	return (
		<section aria-labelledby="routine-versions" className="space-y-3">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div className="min-w-0 flex-1 basis-64">
					<h2 id="routine-versions" className="type-section text-foreground">
						{t('heading')}
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						{t('description')}
						{versions.data
							? ` ${t('keptCount', { count: list.length, max })}`
							: ''}
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
					{t('saveVersion')}
				</Button>
			</div>

			{versions.isPending ? (
				<div
					role="status"
					aria-label={t('loadingVersions')}
					className="space-y-2"
				>
					<Skeleton className="h-12" />
					<Skeleton className="h-12" />
				</div>
			) : versions.isError ? (
				<div role="alert" className="space-y-2">
					<p className="type-body-sm text-ink-2">{t('loadError')}</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void versions.refetch()}
					>
						<RefreshCw aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : list.length === 0 ? (
				<p className="type-body-sm text-ink-3">{t('emptyState')}</p>
			) : (
				<ul>
					{list.map(version => {
						const origin = describeVersionOrigin(version, t)
						return (
							<li
								key={version.id}
								className="rule-row flex flex-wrap items-center gap-2 py-3"
							>
								<div className="min-w-0 flex-1 basis-48">
									<p className="type-panel text-foreground">
										{versionTitle(version, t)}
									</p>
									<p className="type-body-sm text-ink-3">
										{t('savedAt', {
											time: formatTimeAgo(version.createdAt, locale),
											size: describeSetupSize(version.setup, t),
										})}
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
										{t('compare')}
									</Button>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onClick={() => setDeleting(version)}
										aria-label={t('deleteAriaLabel', {
											title: versionTitle(version, t),
										})}
									>
										<Trash2 aria-hidden />
										{t('deleteAction')}
									</Button>
								</div>
							</li>
						)
					})}
				</ul>
			)}

			{full ? (
				<p className="type-body-sm text-ink-3">{t('fullNotice', { max })}</p>
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
							{t('deleteDialogTitle', {
								title: deleting
									? versionTitle(deleting, t)
									: t('deleteFallbackTitle'),
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
								// Stay open until the deletion answers.
								event.preventDefault()
								if (deleting) onDelete(deleting)
							}}
							disabled={remove.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{remove.isPending ? t('deleting') : t('deleteAction')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
