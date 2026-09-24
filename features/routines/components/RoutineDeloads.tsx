'use client'

import type {
	DeloadLoadReduction,
	DeloadSetMode,
	RoutineTemporaryOverride,
	WeightUnit,
} from '@sunsteel/contracts'
import {
	applyDeload,
	DELOAD_DEFAULT_LOAD_REDUCTION,
	DELOAD_DEFAULT_SET_MODE,
	DELOAD_LOAD_REDUCTIONS,
	DELOAD_NOT_LIGHTER,
} from '@sunsteel/contracts'
import {
	CalendarRange,
	CircleStop,
	GitCompare,
	Plus,
	RefreshCw,
	Trash2,
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

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
	useCancelDeload,
	useCreateDeload,
	useEndDeloadEarly,
	useRoutineDeloads,
} from '@/lib/api/hooks/useRoutineDeloads'
import type { Routine } from '@/lib/api/types/routine.type'
import { parseSuggestedDeload } from '@/lib/utils/deload-suggestion'
import {
	DELOAD_DATE_PROBLEMS,
	DELOAD_DEFAULT_DAYS,
	DELOAD_LENGTHS,
	deloadDateProblem,
	deloadEndDate,
	deloadStateLabel,
	describeDeloadLength,
	describeDeloadOptions,
	describeDeloadRange,
	describeDeloadSource,
	firstFreeDate,
} from '@/lib/utils/routine-deloads'
import { routineOn } from '@/lib/utils/routine-schedule'
import {
	compareRoutineSetups,
	routineSetup,
} from '@/lib/utils/routine-versions'

interface RoutineDeloadsProps {
	routine: Routine
	weightUnit: WeightUnit
}

const SET_MODE_LABELS: Record<DeloadSetMode, string> = {
	HALF: 'First half of the sets',
	ALL: 'Every set',
}

function DeloadDialog({
	routine,
	today,
	existing,
	weightUnit,
	initial,
	onClose,
}: {
	routine: Routine
	today: string
	existing: RoutineTemporaryOverride[]
	weightUnit: WeightUnit
	/** INTEL-02: the dates a suggestion opened the dialog with. */
	initial?: { startDate: string; length: number } | null
	onClose: () => void
}) {
	const [startDate, setStartDate] = useState(
		() => initial?.startDate ?? firstFreeDate(today, existing),
	)
	const [length, setLength] = useState(initial?.length ?? DELOAD_DEFAULT_DAYS)
	const [loadReductionPercent, setLoadReductionPercent] =
		useState<DeloadLoadReduction>(DELOAD_DEFAULT_LOAD_REDUCTION)
	const [setMode, setSetMode] = useState<DeloadSetMode>(DELOAD_DEFAULT_SET_MODE)
	const create = useCreateDeload(routine.id)
	const { push } = useToast()

	const endDate = startDate ? deloadEndDate(startDate, length) : ''
	const problem = startDate
		? deloadDateProblem({
				startDate,
				endDate,
				today,
				deloads: existing,
				blocks: routine.trainingBlocks ?? [],
			})
		: null
	// The prescription in force on the start date -- a block's working copy
	// with its progressed loads, or the routine -- is what gets lighter.
	const plan = useMemo(
		() => (startDate && !problem ? routineOn(routine, startDate) : null),
		[routine, startDate, problem],
	)
	const original = useMemo(() => (plan ? routineSetup(plan) : null), [plan])
	const empty =
		!!original && original.days.every(day => day.exercises.length === 0)
	const lighter = useMemo(
		() =>
			original && !empty
				? applyDeload(original, { loadReductionPercent, setMode })
				: null,
		[original, empty, loadReductionPercent, setMode],
	)
	const comparison = useMemo(
		() =>
			original && lighter
				? compareRoutineSetups(original, lighter, weightUnit)
				: null,
		[original, lighter, weightUnit],
	)
	const valid = !!startDate && !problem && !!lighter

	const save = () =>
		create.mutate(
			{ startDate, endDate, loadReductionPercent, setMode },
			{
				onSuccess: saved => {
					push({
						title:
							saved.state === 'ACTIVE' ? 'Deload started' : 'Deload planned',
						description: `${describeDeloadRange(saved)}. The routine and its blocks do not change.`,
						variant: 'success',
					})
					onClose()
				},
				onError: error =>
					push({
						title: 'Deload not saved',
						description: error.message,
						variant: 'destructive',
					}),
			},
		)

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Plan a deload</DialogTitle>
					<DialogDescription>
						For a few days, train a lighter copy of the plan in force. Loads
						don&apos;t progress while it lasts, and the plan returns as it was
						the day after it ends.
					</DialogDescription>
				</DialogHeader>
				<form
					id="routine-deload-form"
					className="space-y-4"
					onSubmit={event => {
						event.preventDefault()
						if (valid) save()
					}}
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="deload-start">Starts</Label>
							<Input
								id="deload-start"
								type="date"
								value={startDate}
								min={today}
								onChange={event => setStartDate(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="deload-length">Lasts</Label>
							<Select
								value={String(length)}
								onValueChange={value => setLength(Number(value))}
							>
								<SelectTrigger id="deload-length" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DELOAD_LENGTHS.map(days => (
										<SelectItem key={days} value={String(days)}>
											{describeDeloadLength(days)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="deload-load">Loads</Label>
							<Select
								value={String(loadReductionPercent)}
								onValueChange={value =>
									setLoadReductionPercent(Number(value) as DeloadLoadReduction)
								}
							>
								<SelectTrigger id="deload-load" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DELOAD_LOAD_REDUCTIONS.map(percent => (
										<SelectItem key={percent} value={String(percent)}>
											{percent === 0 ? 'Keep the loads' : `${percent}% lighter`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="deload-sets">Sets</Label>
							<Select
								value={setMode}
								onValueChange={value => setSetMode(value as DeloadSetMode)}
							>
								<SelectTrigger id="deload-sets" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(['HALF', 'ALL'] as const).map(mode => (
										<SelectItem key={mode} value={mode}>
											{SET_MODE_LABELS[mode]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{startDate ? (
						<p className="type-body-sm text-ink-2">
							{describeDeloadRange({ startDate, endDate })}
							{plan
								? ` · ${plan.trainingBlock ? `lightens the training block “${plan.trainingBlock.name}”` : 'lightens the routine'}`
								: ''}
						</p>
					) : null}
					<p className="type-body-sm text-ink-3">
						Loads drop to the nearest step each exercise can load; one too light
						to cut keeps its weight. Reps, RIR and rest stay the same.
					</p>

					<div role="status" aria-live="polite" className="space-y-3">
						{problem ? (
							<p className="type-body-sm text-ink-2">
								{DELOAD_DATE_PROBLEMS[problem]}
							</p>
						) : empty ? (
							<p className="type-body-sm text-ink-2">
								That plan has no exercises to deload yet.
							</p>
						) : original && !lighter ? (
							<p className="type-body-sm text-ink-2">{DELOAD_NOT_LIGHTER}.</p>
						) : null}
					</div>

					{comparison ? (
						<div className="space-y-2">
							<p className="type-label text-ink-3">What changes</p>
							<RoutineSetupComparison comparison={comparison} />
						</div>
					) : null}
				</form>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						form="routine-deload-form"
						disabled={!valid || create.isPending}
					>
						{create.isPending
							? 'Saving…'
							: startDate === today
								? 'Start deload'
								: 'Plan deload'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function ReviewDeloadDialog({
	deload,
	weightUnit,
	onClose,
}: {
	deload: RoutineTemporaryOverride
	weightUnit: WeightUnit
	onClose: () => void
}) {
	const comparison = useMemo(
		() => compareRoutineSetups(deload.originalSetup, deload.setup, weightUnit),
		[deload, weightUnit],
	)
	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Review deload</DialogTitle>
					<DialogDescription>
						How it differs from the prescription in force when it was planned.
					</DialogDescription>
				</DialogHeader>
				<p className="type-body-sm text-ink-2">
					{describeDeloadRange(deload)} · {describeDeloadOptions(deload)}
				</p>
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

/**
 * ROUT-16: temporary deloads. While one covers a date, that date trains its
 * lighter copy of the plan in force -- the routine's or a training block's --
 * and progression waits; neither the routine nor the block changes.
 */
export function RoutineDeloads({ routine, weightUnit }: RoutineDeloadsProps) {
	const deloads = useRoutineDeloads(routine.id)
	const endEarly = useEndDeloadEarly(routine.id)
	const cancel = useCancelDeload(routine.id)
	const { push } = useToast()
	const [creating, setCreating] = useState(false)
	// INTEL-02: a suggestion link opens the dialog once, on its dates, and the
	// query is dropped so a refresh or Back does not reopen it.
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const suggested = useMemo(
		() => parseSuggestedDeload(searchParams),
		[searchParams],
	)
	const [initial, setInitial] = useState<{
		startDate: string
		length: number
	} | null>(null)
	const opened = useRef(false)
	useEffect(() => {
		if (!suggested || !deloads.data || opened.current) return
		opened.current = true
		setInitial(suggested)
		setCreating(true)
		router.replace(pathname, { scroll: false })
	}, [suggested, deloads.data, router, pathname])
	const [reviewing, setReviewing] = useState<RoutineTemporaryOverride | null>(
		null,
	)
	const [confirming, setConfirming] = useState<{
		action: 'END' | 'CANCEL'
		deload: RoutineTemporaryOverride
	} | null>(null)
	const list = deloads.data?.overrides ?? []

	const onConfirm = () => {
		if (!confirming) return
		const { action, deload } = confirming
		const mutation = action === 'END' ? endEarly : cancel
		mutation.mutate(deload.id, {
			onSuccess: () => {
				push({
					title: action === 'END' ? 'Deload ended' : 'Deload cancelled',
					description:
						action === 'END'
							? 'From today the plan trains as it was. Workouts already done stay as they are.'
							: 'Its days were removed. The routine did not change.',
					variant: 'success',
				})
				setConfirming(null)
			},
			onError: error =>
				push({
					title: action === 'END' ? 'Deload not ended' : 'Deload not cancelled',
					description: error.message,
					variant: 'destructive',
				}),
		})
	}
	const confirmPending = endEarly.isPending || cancel.isPending

	return (
		<section aria-labelledby="routine-deloads" className="space-y-3">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div className="min-w-0 flex-1 basis-64">
					<h2 id="routine-deloads" className="type-section text-foreground">
						Deloads
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						Train lighter for up to {deloads.data?.maxDays ?? 14} days without
						editing the routine or its blocks.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setCreating(true)}
					disabled={!deloads.data}
				>
					<Plus aria-hidden />
					Plan deload
				</Button>
			</div>

			{deloads.isPending ? (
				<div role="status" aria-label="Loading deloads" className="space-y-2">
					<Skeleton className="h-16" />
				</div>
			) : deloads.isError ? (
				<div role="alert" className="space-y-2">
					<p className="type-body-sm text-ink-2">
						Deloads could not be loaded.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void deloads.refetch()}
					>
						<RefreshCw aria-hidden />
						Retry
					</Button>
				</div>
			) : list.length === 0 ? (
				<p className="type-body-sm text-ink-3">
					No deloads yet. Plan one when you need an easier week.
				</p>
			) : (
				<ul>
					{list.map(deload => (
						<li
							key={deload.id}
							className="rule-row flex flex-wrap items-center gap-3 py-3"
						>
							<div className="min-w-0 flex-1 basis-64">
								<div className="flex flex-wrap items-center gap-2">
									<p className="type-panel text-foreground">
										{describeDeloadRange(deload)}
									</p>
									<Badge variant="outline">
										<CalendarRange aria-hidden />
										{deload.endedEarlyAt
											? 'Ended early'
											: deloadStateLabel(deload.state)}
									</Badge>
								</div>
								<p className="type-body-sm mt-1 text-ink-2">
									{describeDeloadOptions(deload)}
								</p>
								<p className="type-body-sm text-ink-3">
									{describeDeloadSource(deload.source)}
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setReviewing(deload)}
								>
									<GitCompare aria-hidden />
									Review
								</Button>
								{deload.state === 'ACTIVE' ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setConfirming({ action: 'END', deload })}
									>
										<CircleStop aria-hidden />
										End early
									</Button>
								) : null}
								{deload.state === 'FUTURE' ? (
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onClick={() => setConfirming({ action: 'CANCEL', deload })}
									>
										<Trash2 aria-hidden />
										Cancel deload
									</Button>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}

			{creating && deloads.data ? (
				<DeloadDialog
					routine={routine}
					today={deloads.data.today}
					existing={list}
					weightUnit={weightUnit}
					initial={initial}
					onClose={() => {
						setCreating(false)
						setInitial(null)
					}}
				/>
			) : null}

			{reviewing ? (
				<ReviewDeloadDialog
					deload={reviewing}
					weightUnit={weightUnit}
					onClose={() => setReviewing(null)}
				/>
			) : null}

			<AlertDialog
				open={!!confirming}
				onOpenChange={open => !open && setConfirming(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirming?.action === 'END'
								? 'End this deload today?'
								: 'Cancel this deload?'}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirming?.action === 'END'
								? 'From today the plan trains at its usual loads again. Workouts you already did during the deload stay as they are.'
								: 'It has not started, so nothing was trained with it. Its lighter days are removed; the routine does not change.'}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep it</AlertDialogCancel>
						<AlertDialogAction
							onClick={event => {
								event.preventDefault()
								onConfirm()
							}}
							disabled={confirmPending}
							className={
								confirming?.action === 'CANCEL'
									? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
									: undefined
							}
						>
							{confirmPending
								? 'Saving…'
								: confirming?.action === 'END'
									? 'End deload'
									: 'Cancel deload'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
