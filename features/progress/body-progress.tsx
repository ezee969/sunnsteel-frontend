'use client'

import type {
	BodyMeasurement,
	BodyProgressRange,
	BodyProgressResponse,
	MeasurableGoal,
	WeightUnit,
} from '@sunsteel/contracts'
import { Loader2, Pencil, Scale, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'

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
import {
	type BodyProgressSource,
	useBodyProgress,
	useDeleteBodyMeasurement,
	useUpsertBodyMeasurement,
} from '@/lib/api/hooks/useBodyMeasurements'
import {
	BODY_LENGTH_FIELDS,
	BODY_PROGRESS_RANGE_OPTIONS,
	type BodyEntryDraft,
	bodyEntryRequest,
	bodyFieldLabel,
	bodyWeightPoints,
	describeBodyChange,
	describeBodyEntry,
	describeBodyWeightGoal,
	draftFromBodyEntry,
	emptyBodyEntryDraft,
	formatBodyDate,
	formatBodyValue,
	getBodyWeightChart,
} from '@/lib/utils/body-progress'
import { localDateKey } from '@/lib/utils/schedule-week'
import { getWeightUnitLabel } from '@/lib/utils/weight-unit'

const CHART_WIDTH = 640
const CHART_HEIGHT = 200
const CHART_PADDING = 24

function RangeControl({
	range,
	onChange,
	label,
}: {
	range: BodyProgressRange
	onChange: (range: BodyProgressRange) => void
	label: string
}) {
	return (
		<div role="group" aria-label={label} className="flex flex-wrap gap-1">
			{BODY_PROGRESS_RANGE_OPTIONS.map(option => (
				<Button
					key={option.value}
					type="button"
					size="sm"
					variant={range === option.value ? 'secondary' : 'ghost'}
					aria-pressed={range === option.value}
					onClick={() => onChange(option.value)}
				>
					{option.label}
				</Button>
			))}
		</div>
	)
}

/**
 * The weight line. Neutral ink on purpose: a weight going up or down is not
 * better or worse than planned, so it carries no honour or warning colour.
 */
function BodyWeightChart({
	id,
	data,
	goals,
	weightUnit,
}: {
	id: string
	data: BodyProgressResponse
	goals?: MeasurableGoal[]
	weightUnit: WeightUnit
}) {
	const points = bodyWeightPoints(data.entries)
	const weight = data.summary.find(entry => entry.field === 'weightKg')
	const goal = describeBodyWeightGoal(goals, weight?.latest ?? null, weightUnit)
	const chart = getBodyWeightChart(
		points,
		goal?.targetKg ?? null,
		CHART_WIDTH,
		CHART_HEIGHT,
		CHART_PADDING,
	)
	const change = weight ? describeBodyChange(weight, weightUnit) : null

	return (
		<div className="min-w-0">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<div>
					<p id={`${id}-title`} className="type-body-sm text-ink-3">
						Weight
					</p>
					<p className="type-data type-data-strong text-foreground">
						{weight?.latest != null
							? formatBodyValue('weightKg', weight.latest, weightUnit)
							: '—'}
					</p>
				</div>
				<div className="type-body-sm text-ink-3 sm:text-right">
					<p>
						{change ??
							(weight?.latest != null
								? 'No change in this range'
								: 'No weight yet')}
					</p>
					{goal ? (
						<p>
							{goal.target} · <span className="text-ink-2">{goal.gap}</span>
						</p>
					) : null}
				</div>
			</div>
			{chart.coordinates.length > 0 ? (
				<div className="mt-4">
					<svg
						role="img"
						aria-labelledby={`${id}-title ${id}-summary`}
						viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
						className="h-auto w-full overflow-visible"
					>
						<line
							x1={CHART_PADDING}
							y1={CHART_HEIGHT - CHART_PADDING}
							x2={CHART_WIDTH - CHART_PADDING}
							y2={CHART_HEIGHT - CHART_PADDING}
							className="stroke-rule"
						/>
						{chart.goalY !== null ? (
							<line
								x1={CHART_PADDING}
								y1={chart.goalY}
								x2={CHART_WIDTH - CHART_PADDING}
								y2={chart.goalY}
								stroke="currentColor"
								strokeDasharray="6 6"
								className="text-ink-3"
							>
								<title>{goal?.target}</title>
							</line>
						) : null}
						{chart.coordinates.length > 1 ? (
							<polyline
								points={chart.coordinates
									.map(({ x, y }) => `${x},${y}`)
									.join(' ')}
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinejoin="round"
								strokeLinecap="round"
								className="text-foreground"
							/>
						) : null}
						{chart.coordinates.map(({ point, x, y }) => (
							<circle
								key={point.date}
								cx={x}
								cy={y}
								r={4}
								fill="currentColor"
								className="text-foreground"
							>
								<title>
									{formatBodyDate(point.date)} ·{' '}
									{formatBodyValue('weightKg', point.weightKg, weightUnit)}
								</title>
							</circle>
						))}
					</svg>
					<p id={`${id}-summary`} className="sr-only">
						{points.length} weight {points.length === 1 ? 'entry' : 'entries'}{' '}
						in this range{change ? `, ${change}` : ''}.
					</p>
					<div className="type-body-sm mt-1 flex justify-between text-ink-3">
						<span>{formatBodyDate(points[0].date)}</span>
						<span>{formatBodyDate(points[points.length - 1].date)}</span>
					</div>
					{goal ? (
						<p className="type-body-sm mt-1 text-ink-3">
							<span aria-hidden>- - </span>Dashed line: your goal
						</p>
					) : null}
				</div>
			) : (
				<p className="type-body-sm mt-4 border border-dashed border-rule bg-surface-sunk p-4 text-ink-3">
					No weight logged in this range.
				</p>
			)}
		</div>
	)
}

/** Every measurement the member has ever recorded: latest value and change. */
function MeasurementList({
	data,
	weightUnit,
}: {
	data: BodyProgressResponse
	weightUnit: WeightUnit
}) {
	const recorded = data.summary.filter(
		entry => entry.field !== 'weightKg' && entry.latest !== null,
	)
	if (recorded.length === 0) {
		return (
			<p className="type-body-sm text-ink-3">
				No measurements besides weight yet.
			</p>
		)
	}
	return (
		<dl className="max-w-[var(--cluster-max)]">
			{recorded.map(entry => (
				<div
					key={entry.field}
					className="rule-row flex items-baseline justify-between gap-4 py-2"
				>
					<dt className="type-body-sm text-ink-2">
						{bodyFieldLabel(entry.field)}
					</dt>
					<dd className="text-right">
						<span className="type-data text-foreground">
							{formatBodyValue(entry.field, entry.latest!, weightUnit)}
						</span>
						<span className="type-body-sm block text-ink-3">
							{describeBodyChange(entry, weightUnit) ??
								`On ${formatBodyDate(entry.latestDate!)}`}
						</span>
					</dd>
				</div>
			))}
		</dl>
	)
}

function BodyProgressBody({
	id,
	query,
	goals,
	weightUnit,
	emptyCopy,
}: {
	id: string
	query: ReturnType<typeof useBodyProgress>
	goals?: MeasurableGoal[]
	weightUnit: WeightUnit
	emptyCopy: React.ReactNode
}) {
	if (query.isPending) {
		return (
			<div
				role="status"
				aria-label="Loading body progress"
				className="space-y-3"
			>
				<Skeleton className="h-40" />
			</div>
		)
	}
	if (query.isError || !query.data) {
		return (
			<div role="alert" className="border border-rule bg-surface p-5">
				<p className="type-panel text-foreground">
					Body progress is unavailable
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="mt-3"
					onClick={() => void query.refetch()}
				>
					Try again
				</Button>
			</div>
		)
	}
	const hasAny = query.data.summary.some(entry => entry.latest !== null)
	if (!hasAny) return <div className="type-body-sm text-ink-3">{emptyCopy}</div>
	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
			<BodyWeightChart
				id={id}
				data={query.data}
				goals={goals}
				weightUnit={weightUnit}
			/>
			<div className="min-w-0">
				<h3 className="type-body-sm text-ink-3">Measurements</h3>
				<div className="mt-1">
					<MeasurementList data={query.data} weightUnit={weightUnit} />
				</div>
			</div>
		</div>
	)
}

function NumberField({
	id,
	label,
	value,
	onChange,
	invalid,
	describedBy,
}: {
	id: string
	label: string
	value: string
	onChange: (value: string) => void
	invalid: boolean
	describedBy?: string
}) {
	return (
		<div className="space-y-1">
			<Label htmlFor={id} className="type-body-sm text-ink-3">
				{label}
			</Label>
			<Input
				id={id}
				inputMode="decimal"
				autoComplete="off"
				value={value}
				onChange={event => onChange(event.target.value)}
				aria-invalid={invalid ? true : undefined}
				aria-describedby={invalid ? describedBy : undefined}
				className="max-w-[var(--field-max)]"
			/>
		</div>
	)
}

function BodyEntryDialog({
	open,
	onOpenChange,
	initial,
	editing,
	weightUnit,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	initial: BodyEntryDraft
	editing: boolean
	weightUnit: WeightUnit
}) {
	const baseId = useId()
	const [draft, setDraft] = useState(initial)
	const [problem, setProblem] = useState<{
		message: string
		field: string | null
	} | null>(null)
	const upsert = useUpsertBodyMeasurement()
	const today = localDateKey(new Date())
	const problemId = `${baseId}-problem`

	const set = (field: keyof BodyEntryDraft) => (value: string) =>
		setDraft(current => ({ ...current, [field]: value }))

	const submit = (event: React.FormEvent) => {
		event.preventDefault()
		const result = bodyEntryRequest(draft, weightUnit, today)
		if (result.problem !== null) {
			setProblem({ message: result.problem, field: result.field })
			return
		}
		setProblem(null)
		upsert.mutate(
			{ date: draft.date, data: result.request },
			{ onSuccess: () => onOpenChange(false) },
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editing ? 'Edit measurements' : 'Log measurements'}
					</DialogTitle>
					<DialogDescription>
						Fill in what you measured; leave the rest empty. One entry per day,
						so logging a day again updates it.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-5" noValidate>
					<div className="space-y-1">
						<Label
							htmlFor={`${baseId}-date`}
							className="type-body-sm text-ink-3"
						>
							Date
						</Label>
						<Input
							id={`${baseId}-date`}
							type="date"
							max={today}
							value={draft.date}
							disabled={editing}
							onChange={event => set('date')(event.target.value)}
							aria-invalid={problem?.field === 'date' ? true : undefined}
							aria-describedby={
								problem?.field === 'date' ? problemId : undefined
							}
							className="max-w-44"
						/>
					</div>
					<NumberField
						id={`${baseId}-weight`}
						label={`Weight (${getWeightUnitLabel(weightUnit)})`}
						value={draft.weightKg}
						onChange={set('weightKg')}
						invalid={problem?.field === 'weightKg'}
						describedBy={problemId}
					/>
					<fieldset className="space-y-2">
						<legend className="type-body-sm text-ink-3">
							Measurements (cm) and body fat (%)
						</legend>
						<div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
							{BODY_LENGTH_FIELDS.map(field => (
								<NumberField
									key={field.key}
									id={`${baseId}-${field.key}`}
									label={
										field.key === 'bodyFatPercent'
											? 'Body fat (%)'
											: field.label
									}
									value={draft[field.key]}
									onChange={set(field.key)}
									invalid={problem?.field === field.key}
									describedBy={problemId}
								/>
							))}
						</div>
					</fieldset>
					{problem ? (
						<p id={problemId} role="alert" className="type-body-sm text-ink">
							{problem.message}
						</p>
					) : null}
					{upsert.isError ? (
						<p role="alert" className="type-body-sm text-ink">
							{upsert.error.message ||
								'This entry could not be saved. Try again.'}
						</p>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={upsert.isPending}>
							{upsert.isPending ? (
								<Loader2 className="size-4 animate-spin" aria-hidden />
							) : null}
							Save
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

function EntryList({
	entries,
	weightUnit,
	onEdit,
	onDelete,
}: {
	entries: BodyMeasurement[]
	weightUnit: WeightUnit
	onEdit: (entry: BodyMeasurement) => void
	onDelete: (entry: BodyMeasurement) => void
}) {
	if (entries.length === 0) return null
	const newestFirst = [...entries].reverse()
	return (
		<div>
			<h3 className="type-body-sm text-ink-3">Entries in this range</h3>
			<ul className="mt-1">
				{newestFirst.map(entry => (
					<li
						key={entry.date}
						className="rule-row flex items-center justify-between gap-3 py-2"
					>
						<div className="min-w-0">
							<p className="type-body-sm text-foreground">
								{formatBodyDate(entry.date)}
							</p>
							<p className="type-body-sm break-words text-ink-3">
								{describeBodyEntry(entry, weightUnit)}
							</p>
						</div>
						<div className="flex shrink-0 gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={`Edit the entry of ${formatBodyDate(entry.date)}`}
								onClick={() => onEdit(entry)}
							>
								<Pencil className="size-4" aria-hidden />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={`Delete the entry of ${formatBodyDate(entry.date)}`}
								onClick={() => onDelete(entry)}
							>
								<Trash2 className="size-4" aria-hidden />
							</Button>
						</div>
					</li>
				))}
			</ul>
		</div>
	)
}

/**
 * PROG-12 on the Progress page: the owner's weight line, measurements, goal
 * context and entries, with logging and editing.
 */
export function BodyProgressSection({
	weightUnit,
	goals,
}: {
	weightUnit: WeightUnit
	goals?: MeasurableGoal[]
}) {
	const [range, setRange] = useState<BodyProgressRange>('90D')
	const query = useBodyProgress({ kind: 'own' }, range)
	const remove = useDeleteBodyMeasurement()
	const [dialog, setDialog] = useState<{
		draft: BodyEntryDraft
		editing: boolean
		key: number
	} | null>(null)
	const [deleting, setDeleting] = useState<BodyMeasurement | null>(null)

	const openNew = () =>
		setDialog({
			draft: emptyBodyEntryDraft(localDateKey(new Date())),
			editing: false,
			key: Date.now(),
		})

	return (
		<section
			id="body-progress"
			aria-labelledby="body-progress-heading"
			className="scroll-mt-24 space-y-4"
		>
			<div className="rule-row flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-2">
				<div className="flex items-start gap-2">
					<Scale className="mt-0.5 size-4 text-ink-3" aria-hidden />
					<div>
						<h2
							id="body-progress-heading"
							className="type-section text-foreground"
						>
							Body progress
						</h2>
						<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
							Your weight and measurements over time. Who else sees them is your{' '}
							<Link
								href="/settings#profile-privacy"
								className="underline underline-offset-4"
							>
								body progress privacy setting
							</Link>
							.
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<RangeControl
						range={range}
						onChange={setRange}
						label="Body progress range"
					/>
					<Button type="button" size="sm" onClick={openNew}>
						Log measurements
					</Button>
				</div>
			</div>
			<BodyProgressBody
				id="own-body-weight"
				query={query}
				goals={goals}
				weightUnit={weightUnit}
				emptyCopy="Log your weight or a measurement to start your history."
			/>
			{query.data ? (
				<EntryList
					entries={query.data.entries}
					weightUnit={weightUnit}
					onEdit={entry =>
						setDialog({
							draft: draftFromBodyEntry(entry, weightUnit),
							editing: true,
							key: Date.now(),
						})
					}
					onDelete={setDeleting}
				/>
			) : null}
			{dialog ? (
				<BodyEntryDialog
					key={dialog.key}
					open
					onOpenChange={open => !open && setDialog(null)}
					initial={dialog.draft}
					editing={dialog.editing}
					weightUnit={weightUnit}
				/>
			) : null}
			<AlertDialog
				open={!!deleting}
				onOpenChange={open => !open && setDeleting(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this entry?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleting
								? `Everything you logged on ${formatBodyDate(deleting.date)} is removed. Your current weight becomes the latest weight you logged before it.`
								: null}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{remove.isError ? (
						<p role="alert" className="type-body-sm text-ink">
							The entry could not be deleted. Try again.
						</p>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel>Keep it</AlertDialogCancel>
						<AlertDialogAction
							onClick={event => {
								event.preventDefault()
								if (!deleting) return
								remove.mutate(deleting.date, {
									onSuccess: () => setDeleting(null),
								})
							}}
							disabled={remove.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{remove.isPending ? 'Deleting…' : 'Delete entry'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}

/**
 * PROG-12 on a profile: read-only. The owner sees their own with a link to
 * log; another member sees it only when the owner's body progress visibility
 * allows it, which the profile decides before rendering this.
 */
export function ProfileBodyProgress({
	source,
	weightUnit,
}: {
	source: BodyProgressSource
	weightUnit: WeightUnit
}) {
	const [range, setRange] = useState<BodyProgressRange>('90D')
	const query = useBodyProgress(source, range)
	const id = useId().replace(/:/g, '')
	return (
		<div className="space-y-4 pt-3">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<RangeControl
					range={range}
					onChange={setRange}
					label="Body progress range"
				/>
				{source.kind === 'own' ? (
					<Link
						href="/progress#body-progress"
						className="type-body-sm text-ink-2 underline underline-offset-4"
					>
						Log on Progress
					</Link>
				) : null}
			</div>
			<BodyProgressBody
				id={`profile-body-${id}`}
				query={query}
				weightUnit={weightUnit}
				emptyCopy={
					source.kind === 'own'
						? 'Nothing logged yet.'
						: 'No body measurements yet.'
				}
			/>
		</div>
	)
}
