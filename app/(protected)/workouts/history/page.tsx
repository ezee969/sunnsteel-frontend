'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSessions } from '@/lib/api/hooks/useWorkoutSession';
import { formatTimeReadable } from '@/lib/utils/time';
import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRoutines } from '@/lib/api/hooks/useRoutines';
import type {
  WorkoutSessionListStatus,
  ListSessionsParams,
} from '@/lib/api/types/workout.type';
import { useSidebar } from '@/hooks/use-sidebar';
import { useDebounce } from '@/hooks/use-debounce';
import { ChevronDown, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import HeroBackdrop from '@/components/backgrounds/HeroBackdrop';
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay';
import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay';
import OrnateCorners from '@/components/backgrounds/OrnateCorners';

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Failed to load sessions';
};

const STATUS_OPTIONS: Array<{ label: string; value?: WorkoutSessionListStatus }> = [
  { label: 'All', value: undefined },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Aborted', value: 'ABORTED' },
];

const SORT_OPTIONS: Array<{
  label: string;
  value: NonNullable<ListSessionsParams['sort']>;
}> = [
  { label: 'Finished (newest)', value: 'finishedAt:desc' },
  { label: 'Finished (oldest)', value: 'finishedAt:asc' },
  { label: 'Started (newest)', value: 'startedAt:desc' },
  { label: 'Started (oldest)', value: 'startedAt:asc' },
];

function WorkoutHistoryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  // Filters state
  const [status, setStatus] = useState<WorkoutSessionListStatus | undefined>(() => {
    const v = search.get('status') as WorkoutSessionListStatus | null;
    return v ?? 'COMPLETED';
  });
  const [routineId, setRoutineId] = useState<string>(
    () => search.get('routineId') ?? ''
  );
  const [from, setFrom] = useState<string>(() => search.get('from') ?? '');
  const [to, setTo] = useState<string>(() => search.get('to') ?? '');
  const [q, setQ] = useState<string>(() => search.get('q') ?? '');
  const [sort, setSort] = useState<NonNullable<ListSessionsParams['sort']>>(
    () =>
      (search.get('sort') as NonNullable<ListSessionsParams['sort']>) ??
      'finishedAt:desc'
  );

  // Debounced search query for auto-apply
  const debouncedQ = useDebounce(q, 250);

  // Collapsible filters state (sync with URL)
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(() => {
    return search.get('filters') === 'open';
  });
  const filtersContentRef = useRef<HTMLDivElement | null>(null);
  const [filtersMaxHeight, setFiltersMaxHeight] = useState<number>(0);
  const { isMobile } = useSidebar();
  const hasInitRef = useRef(false);
  const didMountRef = useRef(false);
  // Default behavior: open on web (desktop), closed on mobile (only if no URL state)
  useEffect(() => {
    if (hasInitRef.current) return;
    if (!search.has('filters')) {
      setIsFiltersOpen(!isMobile);
    }
    hasInitRef.current = true;
  }, [isMobile, search]);

  // Sync filters from URL when the search params change (e.g., back/forward navigation)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const s = search.get('status') as WorkoutSessionListStatus | null;
    setStatus(s ?? undefined);
    setRoutineId(search.get('routineId') ?? '');
    setFrom(search.get('from') ?? '');
    setTo(search.get('to') ?? '');
    setQ(search.get('q') ?? '');
    setSort(
      (search.get('sort') as NonNullable<ListSessionsParams['sort']>) ??
        'finishedAt:desc'
    );
    setIsFiltersOpen(search.get('filters') === 'open');
  }, [search]);

  const params = useMemo(() => {
    return {
      status,
      routineId: routineId || undefined,
      from: from || undefined,
      to: to || undefined,
      q: debouncedQ || undefined,
      sort,
    } as Omit<ListSessionsParams, 'cursor' | 'limit'>;
  }, [status, routineId, from, to, debouncedQ, sort]);

  const { data: routines } = useRoutines();
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useSessions({ ...params, limit: 20 });

  // Helpers: URL sync and validations
  const isDateInvalid = useMemo(() => {
    return Boolean(from && to && from > to);
  }, [from, to]);

  const buildParams = (
    overrides: Partial<{
      status: WorkoutSessionListStatus | undefined;
      routineId: string;
      from: string;
      to: string;
      q: string;
      sort: NonNullable<ListSessionsParams['sort']>;
    }> = {}
  ) => {
    const nextStatus = Object.prototype.hasOwnProperty.call(overrides, 'status')
      ? overrides.status
      : status;
    const nextRoutine = overrides.routineId ?? routineId;
    const nextFrom = overrides.from ?? from;
    const nextTo = overrides.to ?? to;
    const nextQ = overrides.q ?? q;
    const nextSort = overrides.sort ?? sort;

    const datesValid = !(nextFrom && nextTo && nextFrom > nextTo);

    return {
      status: nextStatus,
      routineId: nextRoutine || undefined,
      from: datesValid ? nextFrom || undefined : undefined,
      to: datesValid ? nextTo || undefined : undefined,
      q: nextQ || undefined,
      sort: nextSort,
    } as Omit<ListSessionsParams, 'cursor' | 'limit'>;
  };

  const applyUrl = (
    p: Omit<ListSessionsParams, 'cursor' | 'limit'>,
    filtersOpen?: boolean
  ) => {
    const usp = new URLSearchParams();
    if (p.status) usp.set('status', p.status);
    if (p.routineId) usp.set('routineId', p.routineId);
    if (p.from) usp.set('from', p.from);
    if (p.to) usp.set('to', p.to);
    if (p.q) usp.set('q', p.q);
    if (p.sort) usp.set('sort', p.sort);
    const shouldPersistFilters = filtersOpen ?? isFiltersOpen;
    if (shouldPersistFilters) usp.set('filters', 'open');
    const qs = usp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  // Infinite scroll via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages?.length]);

  // Measure filters content height for smooth collapse animation
  useEffect(() => {
    if (!isFiltersOpen) return;
    if (!filtersContentRef.current) return;
    setFiltersMaxHeight(filtersContentRef.current.scrollHeight);
  }, [isFiltersOpen, status, routineId, from, to, q, sort, routines]);

  // Update measurement on resize while open
  useEffect(() => {
    const onResize = () => {
      if (!isFiltersOpen) return;
      if (!filtersContentRef.current) return;
      setFiltersMaxHeight(filtersContentRef.current.scrollHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isFiltersOpen]);

  const handleApplyFilters = () => {
    const next = buildParams();
    const willClose = true;
    setIsFiltersOpen(false);
    applyUrl(next, !willClose); // false = closed
    refetch();
  };

  const handleChangeStatus = (val: WorkoutSessionListStatus | undefined) => {
    setStatus(val);
    const next = buildParams({ status: val });
    applyUrl(next);
    refetch();
  };

  const handleChangeRoutine = (val: string) => {
    setRoutineId(val);
    const next = buildParams({ routineId: val });
    applyUrl(next);
    refetch();
  };

  const handleChangeSort = (val: NonNullable<ListSessionsParams['sort']>) => {
    setSort(val);
    const next = buildParams({ sort: val });
    applyUrl(next);
    refetch();
  };

  const handleClearAll = () => {
    setStatus('COMPLETED');
    setRoutineId('');
    setFrom('');
    setTo('');
    setQ('');
    setSort('finishedAt:desc');
    const next = buildParams({
      status: 'COMPLETED',
      routineId: '',
      from: '',
      to: '',
      q: '',
      sort: 'finishedAt:desc',
    });
    applyUrl(next);
    refetch();
  };

  const handleToggleFilters = () => {
    const newOpen = !isFiltersOpen;
    setIsFiltersOpen(newOpen);
    const next = buildParams();
    applyUrl(next, newOpen);
  };

  const items = useMemo(() => {
    return (data?.pages ?? []).flatMap((p) => p.items);
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl p-4">
      {/* Classical Hero */}
      <section className="relative overflow-hidden rounded-xl border mb-4 sm:mb-6">
        <HeroBackdrop
          src="/backgrounds/vertical-hero-greek-columns.webp"
          blurPx={5}
          overlayGradient="linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 75%)"
          className="h-[160px] sm:h-[200px]"
        >
          <div className="relative h-full flex items-center px-6 py-4 sm:px-8 sm:py-6">
            <div>
              <h2 className="heading-classical text-2xl sm:text-3xl text-white">
                Training Archive
              </h2>
              <p className="text-white/85 text-sm sm:text-base mt-1">
                Browse and filter your sessions.
              </p>
            </div>
          </div>
        </HeroBackdrop>
        <ParchmentOverlay opacity={0.08} />
        <GoldVignetteOverlay intensity={0.1} />
        <OrnateCorners inset={10} length={28} thickness={1.25} />
      </section>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">Workout History</h1>
          <CardDescription>
            Browse your past workout sessions with filters.
          </CardDescription>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFilters}
              aria-expanded={isFiltersOpen}
              aria-controls="workout-history-filters"
              className="inline-flex items-center gap-1"
            >
              <span>Filter</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  isFiltersOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters (collapsible) */}
          <div
            id="workout-history-filters"
            className="overflow-hidden transition-[max-height,opacity,transform] duration-300"
            style={{
              maxHeight: isFiltersOpen ? filtersMaxHeight : 0,
              opacity: isFiltersOpen ? 1 : 0,
              transform: isFiltersOpen ? 'translateY(0)' : 'translateY(-4px)',
            }}
          >
            <div ref={filtersContentRef}>
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
                    value={status ?? ''}
                    onChange={(e) =>
                      handleChangeStatus(
                        (e.target.value || undefined) as
                          | WorkoutSessionListStatus
                          | undefined
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
                    value={routineId}
                    onChange={(e) => handleChangeRoutine(e.target.value)}
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
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>

                {/* To */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="to" className="text-sm font-medium">
                    To
                  </label>
                  <Input
                    id="to"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                  {isDateInvalid ? (
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
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyFilters();
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
                    value={sort}
                    onChange={(e) =>
                      handleChangeSort(
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
                    onClick={handleApplyFilters}
                    aria-label="Apply filters"
                    className="w-full"
                    disabled={isDateInvalid}
                    variant="classical"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Active filter chips */}
          {(() => {
            const chips: Array<{ key: string; label: string; onClear: () => void }> =
              [];
            if (status) {
              const lbl =
                STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
              chips.push({
                key: 'status',
                label: `Status: ${lbl}`,
                onClear: () => {
                  setStatus(undefined);
                  const next = buildParams({ status: undefined });
                  applyUrl(next);
                  refetch();
                },
              });
            }
            if (routineId) {
              const name =
                (routines ?? []).find((r) => r.id === routineId)?.name ?? 'Unknown';
              chips.push({
                key: 'routine',
                label: `Routine: ${name}`,
                onClear: () => {
                  setRoutineId('');
                  const next = buildParams({ routineId: '' });
                  applyUrl(next);
                  refetch();
                },
              });
            }
            if (from || to) {
              const label =
                from && to
                  ? `Date: ${from} → ${to}`
                  : from
                  ? `From: ${from}`
                  : `To: ${to}`;
              chips.push({
                key: 'date',
                label,
                onClear: () => {
                  setFrom('');
                  setTo('');
                  const next = buildParams({ from: '', to: '' });
                  applyUrl(next);
                  refetch();
                },
              });
            }
            if (q) {
              chips.push({
                key: 'q',
                label: `q: "${q}"`,
                onClear: () => {
                  setQ('');
                  const next = buildParams({ q: '' });
                  applyUrl(next);
                  refetch();
                },
              });
            }
            if (sort && sort !== 'finishedAt:desc') {
              const lbl = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort;
              chips.push({
                key: 'sort',
                label: `Sort: ${lbl}`,
                onClear: () => {
                  setSort('finishedAt:desc');
                  const next = buildParams({ sort: 'finishedAt:desc' });
                  applyUrl(next);
                  refetch();
                },
              });
            }

            if (chips.length === 0) return null;
            return (
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
                  onClick={handleClearAll}
                  aria-label="Clear all filters"
                >
                  Clear all
                </Button>
              </div>
            );
          })()}

          {/* List */}
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading sessions…
            </div>
          ) : isError ? (
            <div
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {getErrorMessage(error)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No sessions found with the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/workouts/history/${s.id}`)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open session ${s.status.toLowerCase()} for ${
                    s.routine.name
                  } started ${new Date(s.startedAt).toLocaleString()}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/workouts/history/${s.id}`);
                    }
                  }}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-medium">
                      {s.routine.name}
                      {s.routine.dayName ? ` · ${s.routine.dayName}` : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.status}</div>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div>
                      <div className="text-muted-foreground">Started</div>
                      <div>{new Date(s.startedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Ended</div>
                      <div>
                        {s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Duration</div>
                      <div>
                        {s.durationSec ? formatTimeReadable(s.durationSec) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Volume / Sets</div>
                      <div>
                        {s.totalVolume ?? '—'} / {s.totalSets ?? '—'}
                      </div>
                    </div>
                  </div>
                  {s.notes ? (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {s.notes}
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Load more controls */}
              {hasNextPage ? (
                <div className="flex items-center justify-center">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="classical"
                    aria-label="Load more"
                  >
                    {isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-xs text-muted-foreground">
                  No more sessions
                </div>
              )}

              {/* Sentinel for auto-loading */}
              <div ref={sentinelRef} className="h-6 w-full" aria-hidden />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkoutHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl p-4">
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading workout history…
          </div>
        </div>
      }
    >
      <WorkoutHistoryContent />
    </Suspense>
  );
}
