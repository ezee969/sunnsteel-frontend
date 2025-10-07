'use client';

import { useParams, useRouter } from 'next/navigation';
import { useWorkoutSessionData } from '@/hooks/use-workout-session-data';
import type { ExerciseGroup } from '@/lib/utils/exercise-groups';
import { HistorySessionHeader } from '@/components/workout/history-session-header';
import { HistoryExerciseGroup } from '@/components/workout/history-exercise-group';
import { useCollapseMap } from '@/hooks/use-collapse-map';

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    session,
    exerciseGroups,
    metrics,
    isLoading,
    isError,
    error,
  } = useWorkoutSessionData(id);

  // UI state: collapsed exercises
  const { toggle, isCollapsed } = useCollapseMap<string>();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading workout details...
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-sm text-destructive" role="alert">
          {String(error) || 'Failed to load workout details'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <HistorySessionHeader
        title={session?.routine?.name}
        metrics={metrics}
        onBack={() => router.back()}
      />

      {/* Exercises */}
      <div className="space-y-4">
        {exerciseGroups.map((group: ExerciseGroup) => (
          <HistoryExerciseGroup
            key={group.routineExerciseId}
            group={group}
            collapsed={isCollapsed(group.routineExerciseId)}
            onToggle={() => toggle(group.routineExerciseId)}
          />
        ))}
      </div>
    </div>
  );
}
