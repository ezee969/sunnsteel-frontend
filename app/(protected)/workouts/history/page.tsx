'use client';

import { useRouter } from 'next/navigation';
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRoutines } from '@/lib/api/hooks/useRoutines';
import type {
  WorkoutSessionListStatus,
  ListSessionsParams,
} from '@/lib/api/types/workout.type';
import { useSidebar } from '@/hooks/use-sidebar';
import { ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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

export default function WorkoutHistoryPage() {
  const router = useRouter();
  // Filters state
  const [status, setStatus] = useState<WorkoutSessionListStatus | undefined>(
    'COMPLETED'
  );
  const [routineId, setRoutineId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [sort, setSort] =
    useState<NonNullable<ListSessionsParams['sort']>>('finishedAt:desc');

  // Collapsible filters state
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const filtersContentRef = useRef<HTMLDivElement | null>(null);
  const [filtersMaxHeight, setFiltersMaxHeight] = useState<number>(0);
  const { isMobile } = useSidebar();
  const hasInitRef = useRef(false);
  // Default behavior: open on web (desktop), closed on mobile
  useEffect(() => {
    if (hasInitRef.current) return;
    setIsFiltersOpen(!isMobile);
    hasInitRef.current = true;
  }, [isMobile]);

  const params = useMemo(() => {
    return {
      status,
      routineId: routineId || undefined,
      from: from || undefined,
      to: to || undefined,
      q: q || undefined,
      sort,
    } as Omit<ListSessionsParams, 'cursor' | 'limit'>;
  }, [status, routineId, from, to, q, sort]);

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
    refetch();
    // Auto-collapse filters after applying
    setIsFiltersOpen(false);
  };

  const items = useMemo(() => {
    return (data?.pages ?? []).flatMap((p) => p.items);
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl p-4">
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
              onClick={() => setIsFiltersOpen((v) => !v)}
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
                      setStatus(
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
                    onChange={(e) => setRoutineId(e.target.value)}
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
                      setSort(
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
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* List */}
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading sessions…
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive" role="alert">
              {String(error)}
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
                    variant="outline"
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
