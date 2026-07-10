import StatCard from './StatCard';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';
import { useSessions } from '@/lib/api/hooks/useWorkoutSession';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatsOverview() {
  const { data, isLoading } = useSessions({ limit: 100 });

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

  const sessions = data?.pages?.flatMap(page => page.items) || [];

  // 1. Weekly Workouts
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday (make Monday start)
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const completedThisWeek = sessions.filter(s => {
    if (s.status !== 'COMPLETED' || !s.endedAt) return false;
    const finishedDate = new Date(s.endedAt);
    return finishedDate >= startOfWeek;
  });

  const weeklyWorkoutsCount = completedThisWeek.length;
  const weeklyGoal = 4; // default target
  const weeklyWorkoutsProgress = Math.min(100, Math.round((weeklyWorkoutsCount / weeklyGoal) * 100));

  // 2. Weekly Consistency (Active Days)
  const activeDaysThisWeek = new Set(
    completedThisWeek.map(s => {
      const date = new Date(s.endedAt || s.startedAt);
      return date.toDateString();
    })
  ).size;
  const activeDaysProgress = Math.min(100, Math.round((activeDaysThisWeek / 7) * 100));

  // 3. Total Workouts Completed
  const totalCompleted = sessions.filter(s => s.status === 'COMPLETED').length;

  // 4. Workout Completion Rate (Completed vs Total Started)
  const totalSessionsCount = sessions.length;
  const completedSessionsCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const completionRate = totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0;

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
        unit={`/ ${weeklyGoal}`}
        subtitle="Workouts completed this week"
        progress={weeklyWorkoutsProgress}
        progressText={`${weeklyWorkoutsProgress}% of target`}
        additionalText={weeklyWorkoutsCount >= weeklyGoal ? 'Goal Met!' : 'Active'}
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
