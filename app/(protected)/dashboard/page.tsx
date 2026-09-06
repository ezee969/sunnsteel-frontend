'use client'

import HeroSection from '@/components/layout/HeroSection'

import DashboardLoading from './components/DashboardLoading'
import PersonalRecords from './components/PersonalRecords'
import RecentActivity from './components/RecentActivity'
import StatsOverview from './components/StatsOverview'
import TodaysWorkouts from './components/TodaysWorkouts'
import { useDashboardData } from './hooks/useDashboardData'

export default function Dashboard() {
	const { isLoading, user } = useDashboardData()

	const name = user?.name?.trim()

	return (
		<div className="flex flex-col gap-4 sm:gap-6">
			{/* Classical Hero — static, so it paints immediately */}
			<HeroSection
				imageSrc="/backgrounds/vertical-hero-greek-columns.webp"
				title={<>Forge Your Path</>}
				subtitle={<>Strength • Discipline • Craft</>}
				innerClassName="max-[400px]:justify-center max-[400px]:text-center"
			/>

			{/*
			 * Everything below is gated on one readiness flag so the dashboard
			 * arrives as a single composed view instead of assembling itself
			 * section by section.
			 */}
			{isLoading ? (
				<DashboardLoading />
			) : (
				<div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 duration-500 sm:gap-6">
					<div className="flex flex-col gap-2">
						<h1
							className="text-2xl sm:text-3xl font-bold tracking-tight"
							style={{
								fontFamily: 'var(--font-oswald), sans-serif',
								textTransform: 'none',
							}}
						>
							{name ? `Welcome back, ${name}!` : 'Welcome back!'}
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base">
							Track your fitness journey and achieve your goals.
						</p>
					</div>

					{/* Today's Workouts - dynamic based on device weekday and user routines */}
					<div className="max-w-3xl">
						<TodaysWorkouts />
					</div>

					{/* Stats Overview */}
					<StatsOverview />

					{/* Recent sessions and records, both derived from the logged sets */}
					<div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
						<RecentActivity />
						<PersonalRecords />
					</div>
				</div>
			)}
		</div>
	)
}
