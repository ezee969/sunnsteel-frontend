"use client";

import { useParams, useRouter } from "next/navigation";
import { useRoutine } from "@/lib/api/hooks/useRoutines";
import { useStartSession } from "@/lib/api/hooks/useWorkoutSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipLoader } from "react-spinners";

const dayName = (dayOfWeek: number) => {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[dayOfWeek] ?? `Day ${dayOfWeek}`;
};

export default function RoutineDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routineId = params?.id as string;

  const { data: routine, isLoading, error } = useRoutine(routineId);
  const { mutateAsync: startSession, isPending: isStarting } = useStartSession();
  const [startActingDayId, setStartActingDayId] = useState<string | null>(null);

  const firstDayId = useMemo(() => routine?.days?.[0]?.id, [routine?.days]);

  const handleStart = async (routineDayId?: string) => {
    if (!routineId || !routineDayId) return;
    try {
      setStartActingDayId(routineDayId);
      const session = await startSession({ routineId, routineDayId });
      if (session?.id) router.push(`/workouts/sessions/${session.id}`);
    } catch (e) {
      console.error("Failed to start session", e);
    } finally {
      setStartActingDayId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ClipLoader color="#3b82f6" size={40} />
          <p className="text-muted-foreground">Loading routine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!routine) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Routine not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/routines" className="underline-offset-2 hover:underline">
          Routines
        </Link>
        <span>/</span>
        <span>{routine.name}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{routine.name}</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              <span>{routine.days?.length ?? 0} days/week</span>
            </Badge>
          </CardTitle>
          {routine.description && (
            <CardDescription>{routine.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {routine.days?.map((day) => (
              <Button
                key={day.id}
                type="button"
                variant="secondary"
                size="sm"
                aria-label={`Start session for ${dayName(day.dayOfWeek)}`}
                onClick={() => handleStart(day.id)}
                disabled={isStarting && startActingDayId === day.id}
              >
                {isStarting && startActingDayId === day.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Dumbbell className="mr-2 h-4 w-4" />
                )}
                {dayName(day.dayOfWeek)}
              </Button>
            ))}
          </div>

          <div>
            <Button
              type="button"
              aria-label="Quick start session"
              onClick={() => handleStart(firstDayId)}
              disabled={!firstDayId || isStarting}
            >
              {isStarting && startActingDayId === firstDayId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Dumbbell className="mr-2 h-4 w-4" />
              )}
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
