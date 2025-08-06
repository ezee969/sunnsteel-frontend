import { Dumbbell, Flame, Heart, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';

export default function StatsOverview() {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Weekly Workouts"
        value="5"
        unit="/ 6"
        subtitle="Workouts completed this week"
        progress={83}
        progressText="83% of goal"
        additionalText="+2"
      />
      <StatCard
        icon={<Flame className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Calories Burned"
        value="1,248"
        unit="kcal"
        subtitle="Today's workout calories"
        progress={62}
        progressText="62% of daily goal"
        additionalText="+320"
      />
      <StatCard
        icon={<Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Heart Rate"
        value="142"
        unit="BPM"
        subtitle="Average during last workout"
        progress={75}
        progressText="75% of max heart rate"
        additionalText="Zone 3"
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
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
