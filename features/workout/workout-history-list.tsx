import type { Ref } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatTimeReadable } from '@/lib/utils/time';
import type { WorkoutSessionSummary } from '@/lib/api/types/workout.type';

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Failed to load sessions';
};

export interface WorkoutHistoryListProps {
  data: {
    items: WorkoutSessionSummary[];
    isLoading: boolean;
    isError: boolean;
    error: unknown;
  };
  pagination: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    sentinelRef: Ref<HTMLDivElement>;
  };
}

export function WorkoutHistoryList({
  data: { items, isLoading, isError, error },
  pagination: { hasNextPage, isFetchingNextPage, fetchNextPage, sentinelRef },
}: WorkoutHistoryListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Loading sessions…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive" role="alert" aria-live="polite">
        {getErrorMessage(error)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No sessions found with the current filters.
      </div>
    );
  }

  return (
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
              <div>{s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Duration</div>
              <div>{s.durationSec ? formatTimeReadable(s.durationSec) : '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Volume / Sets</div>
              <div>
                {s.totalVolume ?? '—'} / {s.totalSets ?? '—'}
              </div>
            </div>
          </div>
          {s.notes && (
            <div className="mt-2 text-sm text-muted-foreground">{s.notes}</div>
          )}
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
  );
}
