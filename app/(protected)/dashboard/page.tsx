'use client';

import StatsOverview from './components/StatsOverview';
import WorkoutPrograms from './components/WorkoutPrograms';
import { useUser } from '@/lib/api/hooks/useUser';
import TodaysWorkouts from './components/TodaysWorkouts';
import HeroSection from '@/components/layout/HeroSection';

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Classical Hero */}
      <HeroSection
        imageSrc="/backgrounds/vertical-hero-greek-columns.webp"
        title={<>Forge Your Path</>}
        subtitle={<>Strength • Discipline • Craft</>}
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track your fitness journey and achieve your goals.
        </p>
      </div>

      {/* Today's Workouts - dynamic based on device weekday and user routines */}
      <TodaysWorkouts />

      {/* Stats Overview */}
      {/* <StatsOverview /> */}

      {/* Workout Programs */}
      {/* <WorkoutPrograms /> */}
    </div>
  );
}
