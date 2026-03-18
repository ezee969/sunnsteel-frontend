import type { Ref } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';
import type { WorkoutSessionListStatus, ListSessionsParams } from '@/lib/api/types/workout.type';
import type { Routine } from '@/lib/api/types/routine.type';

export const STATUS_OPTIONS: Array<{ label: string; value?: WorkoutSessionListStatus }> = [
  { label: 'All', value: undefined },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Aborted', value: 'ABORTED' },
];

export const SORT_OPTIONS: Array<{
  label: string;
  value: NonNullable<ListSessionsParams['sort']>;
}> = [
  { label: 'Finished (newest)', value: 'finishedAt:desc' },
  { label: 'Finished (oldest)', value: 'finishedAt:asc' },
  { label: 'Started (newest)', value: 'startedAt:desc' },
  { label: 'Started (oldest)', value: 'startedAt:asc' },
];

export interface WorkoutHistoryFiltersProps {
  filters: {
    status: WorkoutSessionListStatus | undefined;
    routineId: string;
    from: string;
    to: string;
    q: string;
    sort: NonNullable<ListSessionsParams['sort']>;
    isFiltersOpen: boolean;
    isDateInvalid: boolean;
    setFrom: (v: string) => void;
    setTo: (v: string) => void;
    setQ: (v: string) => void;
    handleClearAll: () => void;
  };
  layout: {
    filtersContentRef: Ref<HTMLDivElement>;
    filtersMaxHeight: number;
  };
  routines: Routine[] | undefined;
  actions: {
    handleApplyFilters: () => void;
    handleChangeStatus: (val: WorkoutSessionListStatus | undefined) => void;
    handleChangeRoutine: (val: string) => void;
    handleChangeSort: (val: NonNullable<ListSessionsParams['sort']>) => void;
    handleClearFilter: (key: string) => void;
  };
}

export function WorkoutHistoryFilters({
  filters: f,
  layout,
  routines,
  actions: a,
}: WorkoutHistoryFiltersProps) {
  // Active Filter Chips
  const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
  if (f.status) {
    const lbl = STATUS_OPTIONS.find((o) => o.value === f.status)?.label ?? f.status;
    chips.push({
      key: 'status',
      label: `Status: ${lbl}`,
      onClear: () => a.handleClearFilter('status'),
    });
  }
  if (f.routineId) {
    const name = (routines ?? []).find((r) => r.id === f.routineId)?.name ?? 'Unknown';
    chips.push({
      key: 'routine',
      label: `Routine: ${name}`,
      onClear: () => a.handleClearFilter('routine'),
    });
  }
  if (f.from || f.to) {
    const label =
      f.from && f.to ? `Date: ${f.from} → ${f.to}` : f.from ? `From: ${f.from}` : `To: ${f.to}`;
    chips.push({
      key: 'date',
      label,
      onClear: () => a.handleClearFilter('date'),
    });
  }
  if (f.q) {
    chips.push({
      key: 'q',
      label: `q: "${f.q}"`,
      onClear: () => a.handleClearFilter('q'),
    });
  }
  if (f.sort && f.sort !== 'finishedAt:desc') {
    const lbl = SORT_OPTIONS.find((o) => o.value === f.sort)?.label ?? f.sort;
    chips.push({
      key: 'sort',
      label: `Sort: ${lbl}`,
      onClear: () => a.handleClearFilter('sort'),
    });
  }

  return (
    <>
      <div
        id="workout-history-filters"
        className="overflow-hidden transition-[max-height,opacity,transform] duration-300"
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
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                aria-label="Filter by status"
                className="h-9 rounded-md border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={f.status ?? ''}
                onChange={(e) =>
                  a.handleChangeStatus(
                    (e.target.value || undefined) as WorkoutSessionListStatus | undefined
                  )
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value ?? ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Routine */}
            <div className="flex flex-col gap-1">
              <label htmlFor="routine" className="text-sm font-medium">
                Routine
              </label>
              <select
                id="routine"
                aria-label="Filter by routine"
                className="h-9 rounded-md border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={f.routineId}
                onChange={(e) => a.handleChangeRoutine(e.target.value)}
              >
                <option value="">All</option>
                {(routines ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* From */}
            <div className="flex flex-col gap-1">
              <label htmlFor="from" className="text-sm font-medium">
                From
              </label>
              <Input
                id="from"
                type="date"
                value={f.from}
                onChange={(e) => f.setFrom(e.target.value)}
              />
            </div>

            {/* To */}
            <div className="flex flex-col gap-1">
              <label htmlFor="to" className="text-sm font-medium">
                To
              </label>
              <Input id="to" type="date" value={f.to} onChange={(e) => f.setTo(e.target.value)} />
              {f.isDateInvalid ? (
                <span className="text-xs text-destructive">
                  From date must be before or equal to To date.
                </span>
              ) : null}
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="q" className="text-sm font-medium">
                Search notes
              </label>
              <Input
                id="q"
                placeholder="e.g., leg day, PR, soreness"
                value={f.q}
                onChange={(e) => f.setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') a.handleApplyFilters();
                }}
              />
            </div>

            {/* Sort + Apply */}
            <div className="flex flex-col gap-1">
              <label htmlFor="sort" className="text-sm font-medium">
                Sort
              </label>
              <select
                id="sort"
                aria-label="Sort order"
                className="h-9 rounded-md border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={f.sort}
                onChange={(e) =>
                  a.handleChangeSort(
                    e.target.value as NonNullable<ListSessionsParams['sort']>
                  )
                }
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={a.handleApplyFilters}
                aria-label="Apply filters"
                className="w-full"
                disabled={f.isDateInvalid}
                variant="classical"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {chips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
            >
              <span>{c.label}</span>
              <button
                type="button"
                onClick={c.onClear}
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Clear ${c.key} filter`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={f.handleClearAll}
            aria-label="Clear all filters"
          >
            Clear all
          </Button>
        </div>
      )}
    </>
  );
}
