'use client';

import StatsOverview from './components/StatsOverview';
import WorkoutPrograms from './components/WorkoutPrograms';
import { useUser } from '@/lib/api/hooks/useUser';
import TodaysWorkouts from './components/TodaysWorkouts';
import HeroBackdrop from '@/components/backgrounds/HeroBackdrop';
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay';
import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay';
import OrnateCorners from '@/components/backgrounds/OrnateCorners';

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Classical Hero */}
      <section className="relative overflow-hidden rounded-xl border">
        <HeroBackdrop
          src="/backgrounds/vertical-hero-greek-columns.webp"
          blurPx={5}
          overlayGradient="linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 75%)"
          className="h-[160px] sm:h-[200px]"
        >
          <div className="relative h-full flex items-center px-6 py-4 sm:px-8 sm:py-6">
            <div>
              <h2 className="heading-classical text-2xl sm:text-3xl text-white">
                Forge Your Path
              </h2>
              <p className="text-white/85 text-sm sm:text-base mt-1">
                Strength • Discipline • Craft
              </p>
            </div>
          </div>
        </HeroBackdrop>
        <ParchmentOverlay opacity={0.08} />
        <GoldVignetteOverlay intensity={0.1} />
        <OrnateCorners inset={10} length={28} thickness={1.25} />
      </section>

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
      <WorkoutPrograms />
    </div>
  );
}
