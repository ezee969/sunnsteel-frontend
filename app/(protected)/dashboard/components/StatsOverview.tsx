import { useMemo } from 'react';
import StatCard from './StatCard';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';
import { useSessions } from '@/lib/api/hooks/useWorkoutSession';
import { Skeleton } from '@/components/ui/skeleton';

const WEEKLY_GOAL = 4;

export default function StatsOverview() {
  // 50 is the backend's hard ceiling (`@Max(50)` on ListSessionsDto.limit).
  // Asking for 100 made this endpoint return 400 on every dashboard load, so
  // these four cards silently rendered 0 for everyone. See TD-22.
  const { data, isLoading } = useSessions({ limit: 50 });

  // Derived in a single pass and memoised. This used to run on every render of
  // the dashboard: a flatMap, four filters and a Set over the whole session
  // list. It has to sit ABOVE the early return below — moving it down would
  // break the rules of hooks. See TD-11.
  const stats = useMemo(() => {
    const sessions = data?.pages?.flatMap(page => page.items) || [];

    // Week starts on Monday; getDay() is 0 for Sunday, so shift it back 6 days.
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    startOfWeek.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const completed = sessions.filter(s => s.status === 'COMPLETED');

    const completedThisWeek = completed.filter(s => {
      if (!s.endedAt) return false;
      return new Date(s.endedAt) >= startOfWeek;
    });

    const activeDaysThisWeek = new Set(
      completedThisWeek.map(s => new Date(s.endedAt || s.startedAt).toDateString()),
    ).size;

    const weeklyWorkoutsCount = completedThisWeek.length;

    return {
      weeklyWorkoutsCount,
      weeklyWorkoutsProgress: Math.min(
        100,
        Math.round((weeklyWorkoutsCount / WEEKLY_GOAL) * 100),
      ),
      activeDaysThisWeek,
      activeDaysProgress: Math.min(100, Math.round((activeDaysThisWeek / 7) * 100)),
      totalCompleted: completed.length,
      completionRate: sessions.length
        ? Math.round((completed.length / sessions.length) * 100)
        : 0,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3 bg-card/50">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const {
    weeklyWorkoutsCount,
    weeklyWorkoutsProgress,
    activeDaysThisWeek,
    activeDaysProgress,
    totalCompleted,
    completionRate,
  } = stats;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={
          <ClassicalIcon
            name="two-dumbbells"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
            aria-hidden
          />
        }
        title="Weekly Workouts"
        value={String(weeklyWorkoutsCount)}
        unit={`/ ${WEEKLY_GOAL}`}
        subtitle="Workouts completed this week"
        progress={weeklyWorkoutsProgress}
        progressText={`${weeklyWorkoutsProgress}% of target`}
        additionalText={weeklyWorkoutsCount >= WEEKLY_GOAL ? 'Goal Met!' : 'Active'}
      />
      <StatCard
        icon={
          <ClassicalIcon
            name="compass"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
            aria-hidden
          />
        }
        title="Active Days"
        value={String(activeDaysThisWeek)}
        unit="/ 7"
        subtitle="Active training days this week"
        progress={activeDaysProgress}
        progressText={`${activeDaysThisWeek} days active`}
        additionalText={activeDaysThisWeek >= 3 ? 'Consistent' : 'Resting'}
      />
      <StatCard
        icon={
          <ClassicalIcon
            name="laurel-wreath"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
            aria-hidden
          />
        }
        title="Total Workouts"
        value={String(totalCompleted)}
        subtitle="Total completed training sessions"
        progress={totalCompleted}
        progressMax={Math.max(50, totalCompleted)}
        progressText="Target: 50 Sessions"
        additionalText={`${Math.max(0, 50 - totalCompleted)} left`}
      />
      <StatCard
        icon={
          <ClassicalIcon
            name="shield"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
            aria-hidden
          />
        }
        title="Completion Rate"
        value={`${completionRate}%`}
        subtitle="Percentage of completed sets"
        progress={completionRate}
        progressText="Set completion efficiency"
        additionalText={completionRate >= 90 ? 'Excellent' : 'On Track'}
      />
    </div>
  );
}
