import StatCard from './StatCard';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';

export default function StatsOverview() {
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
        value="5"
        unit="/ 6"
        subtitle="Workouts completed this week"
        progress={83}
        progressText="83% of goal"
        additionalText="+2"
      />
      <StatCard
        icon={
          <ClassicalIcon
            name="compass"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
            aria-hidden
          />
        }
        title="Training Consistency"
        value="4"
        unit="/ 7"
        subtitle="Active days this week"
        progress={57}
        progressText="57% of weekly target"
        additionalText="Streak 3"
      />
      <StatCard
        icon={
          <ClassicalIcon
            name="shield"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
            aria-hidden
          />
        }
        title="Heart Rate"
        value="142"
        unit="BPM"
        subtitle="Average during last workout"
        progress={75}
        progressText="75% of max heart rate"
        additionalText="Zone 3"
      />
      <StatCard
        icon={
          <ClassicalIcon
            name="laurel-wreath"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary"
            aria-hidden
          />
        }
        title="Strength Progress"
        value="+8%"
        subtitle="Overall strength increase"
        progress={8}
        progressMax={20}
        progressText="Monthly target: 10%"
        additionalText="On track"
      />
    </div>
  );
}
