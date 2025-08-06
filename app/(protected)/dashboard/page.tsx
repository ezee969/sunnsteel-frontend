'use client';

import HeroCard from './components/HeroCard'; // Move to shared components
import StatsOverview from './components/StatsOverview';
import WorkoutPrograms from './components/WorkoutPrograms';
import { useUser } from '@/lib/api/hooks/useUser';

export default function Dashboard() {
  const { user } = useUser();
  // Event handlers
  const handleStartWorkout = () => {
    console.log('Starting workout');
  };

  const handleViewWorkoutDetails = () => {
    console.log('Viewing workout details');
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track your fitness journey and achieve your goals.
        </p>
      </div>

      {/* Hero Card */}
      <HeroCard
        title="Today's Workout Plan"
        description="Your chest and triceps workout is scheduled for today."
        primaryAction={{
          text: 'Start Workout',
          onClick: handleStartWorkout,
        }}
        secondaryAction={{
          text: 'Details',
          onClick: handleViewWorkoutDetails,
        }}
        progressPercentage={25}
      />

      {/* Stats Overview */}
      <StatsOverview />

      {/* Workout Programs */}
      <WorkoutPrograms />
    </div>
  );
}
