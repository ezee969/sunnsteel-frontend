import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import type {
  WorkoutSessionListStatus,
  ListSessionsParams,
} from '@/lib/api/types/workout.type';

export function useWorkoutHistoryFilters(initialIsMobile: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [status, setStatus] = useState<WorkoutSessionListStatus | undefined>(() => {
    const v = search.get('status') as WorkoutSessionListStatus | null;
    return v ?? 'COMPLETED';
  });
  const [routineId, setRoutineId] = useState<string>(() => search.get('routineId') ?? '');
  const [from, setFrom] = useState<string>(() => search.get('from') ?? '');
  const [to, setTo] = useState<string>(() => search.get('to') ?? '');
  const [q, setQ] = useState<string>(() => search.get('q') ?? '');
  const [sort, setSort] = useState<NonNullable<ListSessionsParams['sort']>>(() =>
    (search.get('sort') as NonNullable<ListSessionsParams['sort']>) ?? 'finishedAt:desc'
  );

  const debouncedQ = useDebounce(q, 250);

  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(() => search.get('filters') === 'open');
  const hasInitRef = useRef(false);
  const didMountRef = useRef(false);

  useEffect(() => {
    if (hasInitRef.current) return;
    if (!search.has('filters')) {
      setIsFiltersOpen(!initialIsMobile);
    }
    hasInitRef.current = true;
  }, [initialIsMobile, search]);

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
      (search.get('sort') as NonNullable<ListSessionsParams['sort']>) ?? 'finishedAt:desc'
    );
    setIsFiltersOpen(search.get('filters') === 'open');
  }, [search]);

  const isDateInvalid = useMemo(() => Boolean(from && to && from > to), [from, to]);

  const buildParams = useCallback(
    (
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
    },
    [status, routineId, from, to, q, sort]
  );

  const applyUrl = useCallback(
    (p: Omit<ListSessionsParams, 'cursor' | 'limit'>, filtersOpen?: boolean) => {
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
    },
    [isFiltersOpen, pathname, router]
  );

  const params = useMemo(() => ({
    status,
    routineId: routineId || undefined,
    from: from || undefined,
    to: to || undefined,
    q: debouncedQ || undefined,
    sort,
  }) as Omit<ListSessionsParams, 'cursor' | 'limit'>, [status, routineId, from, to, debouncedQ, sort]);

  const handleClearAll = useCallback(() => {
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
  }, [buildParams, applyUrl]);

  const handleToggleFilters = useCallback(() => {
    const newOpen = !isFiltersOpen;
    setIsFiltersOpen(newOpen);
    const next = buildParams();
    applyUrl(next, newOpen);
  }, [isFiltersOpen, buildParams, applyUrl]);

  return {
    // state
    status, setStatus,
    routineId, setRoutineId,
    from, setFrom,
    to, setTo,
    q, setQ,
    sort, setSort,
    isFiltersOpen, setIsFiltersOpen,
    debouncedQ,
    isDateInvalid,
    
    // queries
    params,
    
    // actions
    buildParams,
    applyUrl,
    handleClearAll,
    handleToggleFilters,
  };
}
