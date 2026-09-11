'use client'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'

import DashboardLoading from './components/DashboardLoading'
import PersonalRecords from './components/PersonalRecords'
import RecentActivity from './components/RecentActivity'
import StatsOverview from './components/StatsOverview'
import TodaysWorkouts from './components/TodaysWorkouts'
import { useDashboardData } from './hooks/useDashboardData'

export default function Dashboard() {
	const { isLoading, user, progress } = useDashboardData()

	const name = user?.name?.trim()

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			{/* Classical Hero — static, so it paints immediately */}
			<HeroSection
				title={<>Forge Your Path</>}
				subtitle={<>Strength • Discipline • Craft</>}
			/>

			{/*
			 * Everything below is gated on one readiness flag so the dashboard
			 * arrives as a single composed view instead of assembling itself
			 * section by section.
			 */}
			{progress.bootstrapError ? (
				<div role="alert" className="flex flex-col items-start gap-3">
					<p className="type-body-sm text-foreground">
						Unable to prepare your workout progress. Please try again.
					</p>
					<Button
						onClick={() => {
							void progress.retryBootstrap().catch(() => undefined)
						}}
					>
						Retry
					</Button>
				</div>
			) : isLoading ? (
				<DashboardLoading />
			) : (
				// §9.2 — no page-level entrance animation. The whole dashboard used
				// to fade and rise on every visit, which delays perceived load and is
				// the exact trope the plan forbids.
				<div className="flex flex-col gap-8 sm:gap-12">
					<div className="flex flex-col gap-1">
						{/* The masthead above already carries the page rank, so the
						    greeting is a panel title rather than a second inscription
						    competing with it (§5.3 — Cinzel appears at most twice, and
						    the inline font-family override went with the old rank). */}
						<p className="type-panel text-foreground">
							{name ? `Welcome back, ${name}!` : 'Welcome back!'}
						</p>
						<p className="type-body-sm text-ink-3">
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
					<div className="grid gap-8 sm:gap-12 lg:grid-cols-2">
						<RecentActivity />
						<PersonalRecords />
					</div>
				</div>
			)}
		</div>
	)
}
