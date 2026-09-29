import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Ref } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import type { Translator } from '@/i18n/translator'
import type { Routine } from '@/lib/api/types/routine.type'
import type {
	ListSessionsParams,
	WorkoutSessionListStatus,
} from '@/lib/api/types/workout.type'

export function statusOptions(t: Translator<'workout.historyFilters'>): Array<{
	label: string
	value?: WorkoutSessionListStatus
}> {
	return [
		{ label: t('statusAll'), value: undefined },
		{ label: t('statusInProgress'), value: 'IN_PROGRESS' },
		{ label: t('statusCompleted'), value: 'COMPLETED' },
		{ label: t('statusAborted'), value: 'ABORTED' },
	]
}

export function sortOptions(t: Translator<'workout.historyFilters'>): Array<{
	label: string
	value: NonNullable<ListSessionsParams['sort']>
}> {
	return [
		{ label: t('sortFinishedDesc'), value: 'finishedAt:desc' },
		{ label: t('sortFinishedAsc'), value: 'finishedAt:asc' },
		{ label: t('sortStartedDesc'), value: 'startedAt:desc' },
		{ label: t('sortStartedAsc'), value: 'startedAt:asc' },
	]
}

export interface WorkoutHistoryFiltersProps {
	filters: {
		status: WorkoutSessionListStatus | undefined
		routineId: string
		from: string
		to: string
		q: string
		sort: NonNullable<ListSessionsParams['sort']>
		isFiltersOpen: boolean
		isDateInvalid: boolean
		setFrom: (v: string) => void
		setTo: (v: string) => void
		setQ: (v: string) => void
		handleClearAll: () => void
	}
	layout: {
		filtersContentRef: Ref<HTMLDivElement>
		filtersMaxHeight: number
	}
	routines: Routine[] | undefined
	actions: {
		handleApplyFilters: () => void
		handleChangeStatus: (val: WorkoutSessionListStatus | undefined) => void
		handleChangeRoutine: (val: string) => void
		handleChangeSort: (val: NonNullable<ListSessionsParams['sort']>) => void
		handleClearFilter: (key: string) => void
	}
}

export function WorkoutHistoryFilters({
	filters: f,
	layout,
	routines,
	actions: a,
}: WorkoutHistoryFiltersProps) {
	const t = useTranslations('workout.historyFilters')
	const STATUS_OPTIONS = statusOptions(t)
	const SORT_OPTIONS = sortOptions(t)
	// Active Filter Chips
	const chips: Array<{ key: string; label: string; onClear: () => void }> = []
	if (f.status) {
		const lbl =
			STATUS_OPTIONS.find(o => o.value === f.status)?.label ?? f.status
		chips.push({
			key: 'status',
			label: t('chipStatus', { value: lbl }),
			onClear: () => a.handleClearFilter('status'),
		})
	}
	if (f.routineId) {
		const name =
			(routines ?? []).find(r => r.id === f.routineId)?.name ??
			t('unknownRoutine')
		chips.push({
			key: 'routine',
			label: t('chipRoutine', { value: name }),
			onClear: () => a.handleClearFilter('routine'),
		})
	}
	if (f.from || f.to) {
		const label =
			f.from && f.to
				? t('chipDateRange', { from: f.from, to: f.to })
				: f.from
					? t('chipFrom', { value: f.from })
					: t('chipTo', { value: f.to })
		chips.push({
			key: 'date',
			label,
			onClear: () => a.handleClearFilter('date'),
		})
	}
	if (f.q) {
		chips.push({
			key: 'q',
			label: t('chipSearch', { value: f.q }),
			onClear: () => a.handleClearFilter('q'),
		})
	}
	if (f.sort && f.sort !== 'finishedAt:desc') {
		const lbl = SORT_OPTIONS.find(o => o.value === f.sort)?.label ?? f.sort
		chips.push({
			key: 'sort',
			label: t('chipSort', { value: lbl }),
			onClear: () => a.handleClearFilter('sort'),
		})
	}

	return (
		<>
			<div
				id="workout-history-filters"
				className="overflow-hidden transition-[max-height,opacity,transform] duration-[var(--motion-slow)] ease-standard"
				style={{
					maxHeight: f.isFiltersOpen ? layout.filtersMaxHeight : 0,
					opacity: f.isFiltersOpen ? 1 : 0,
					transform: f.isFiltersOpen ? 'translateY(0)' : 'translateY(-4px)',
				}}
			>
				<div ref={layout.filtersContentRef}>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{/* Status */}
						<div className="flex flex-col gap-1">
							<label htmlFor="status" className="type-body-sm text-ink-3">
								{t('statusLabel')}
							</label>
							<NativeSelect
								id="status"
								aria-label={t('filterByStatusAria')}
								value={f.status ?? ''}
								onChange={e =>
									a.handleChangeStatus(
										(e.target.value || undefined) as
											WorkoutSessionListStatus | undefined,
									)
								}
							>
								{STATUS_OPTIONS.map(opt => (
									<option key={opt.label} value={opt.value ?? ''}>
										{opt.label}
									</option>
								))}
							</NativeSelect>
						</div>

						{/* Routine */}
						<div className="flex flex-col gap-1">
							<label htmlFor="routine" className="type-body-sm text-ink-3">
								{t('routineLabel')}
							</label>
							<NativeSelect
								id="routine"
								aria-label={t('filterByRoutineAria')}
								value={f.routineId}
								onChange={e => a.handleChangeRoutine(e.target.value)}
							>
								<option value="">{t('allRoutines')}</option>
								{(routines ?? []).map(r => (
									<option key={r.id} value={r.id}>
										{r.name}
									</option>
								))}
							</NativeSelect>
						</div>

						{/* From */}
						<div className="flex flex-col gap-1">
							<label htmlFor="from" className="type-body-sm text-ink-3">
								{t('fromLabel')}
							</label>
							<Input
								id="from"
								aria-invalid={f.isDateInvalid || undefined}
								aria-describedby={
									f.isDateInvalid ? 'history-date-error' : undefined
								}
								className="max-w-[var(--cluster-max)]"
								type="date"
								value={f.from}
								onChange={e => f.setFrom(e.target.value)}
							/>
						</div>

						{/* To */}
						<div className="flex flex-col gap-1">
							<label htmlFor="to" className="type-body-sm text-ink-3">
								{t('toLabel')}
							</label>
							<Input
								id="to"
								aria-invalid={f.isDateInvalid || undefined}
								aria-describedby={
									f.isDateInvalid ? 'history-date-error' : undefined
								}
								className="max-w-[var(--cluster-max)]"
								type="date"
								value={f.to}
								onChange={e => f.setTo(e.target.value)}
							/>
							{f.isDateInvalid ? (
								<span
									id="history-date-error"
									role="alert"
									className="type-body-sm text-destructive"
								>
									{t('dateOrderError')}
								</span>
							) : null}
						</div>

						{/* Search */}
						<div className="flex flex-col gap-1 sm:col-span-2">
							<label htmlFor="q" className="type-body-sm text-ink-3">
								{t('searchLabel')}
							</label>
							<Input
								id="q"
								placeholder={t('searchPlaceholder')}
								value={f.q}
								onChange={e => f.setQ(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') a.handleApplyFilters()
								}}
							/>
						</div>

						{/* Sort + Apply */}
						<div className="flex flex-col gap-1">
							<label htmlFor="sort" className="type-body-sm text-ink-3">
								{t('sortLabel')}
							</label>
							<NativeSelect
								id="sort"
								aria-label={t('sortOrderAria')}
								value={f.sort}
								onChange={e =>
									a.handleChangeSort(
										e.target.value as NonNullable<ListSessionsParams['sort']>,
									)
								}
							>
								{SORT_OPTIONS.map(opt => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</NativeSelect>
						</div>

						<div className="flex items-end">
							<Button
								onClick={a.handleApplyFilters}
								aria-label={t('applyAria')}
								className="w-full sm:w-auto"
								disabled={f.isDateInvalid}
								variant="default"
							>
								{t('apply')}
							</Button>
						</div>
					</div>
				</div>
			</div>

			<Separator className="my-4" />

			{chips.length > 0 && (
				<div className="mb-3 flex flex-wrap items-center gap-2">
					{chips.map(c => (
						<span
							key={c.key}
							className="type-body-sm inline-flex items-center gap-1 rounded-none border border-rule px-2 py-0.5 text-ink-2"
						>
							<span>{c.label}</span>
							<button
								type="button"
								onClick={c.onClear}
								className="rounded-none p-0.5 text-ink-3 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-muted hover:text-foreground"
								aria-label={t('clearFilterAria', { key: c.key })}
							>
								<X className="h-3 w-3" aria-hidden="true" />
							</button>
						</span>
					))}
					<Button
						variant="ghost"
						size="sm"
						onClick={f.handleClearAll}
						aria-label={t('clearAllAria')}
					>
						{t('clearAll')}
					</Button>
				</div>
			)}
		</>
	)
}
