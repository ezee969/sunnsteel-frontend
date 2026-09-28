'use client'

import type { DashboardSectionId } from '@sunsteel/contracts'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { dashboardRows } from '@/lib/utils/dashboard-layout'

import { CustomizeDashboardDialog } from './components/CustomizeDashboardDialog'
import DashboardLoading from './components/DashboardLoading'
import FollowingPreview from './components/FollowingPreview'
import PersonalRecords from './components/PersonalRecords'
import RecentActivity from './components/RecentActivity'
import StatsOverview from './components/StatsOverview'
import TodaysWorkouts from './components/TodaysWorkouts'
import TrainingInsights from './components/TrainingInsights'
import UpcomingMilestones from './components/UpcomingMilestones'
import WeekStrip from './components/WeekStrip'
import { useDashboardData } from './hooks/useDashboardData'

/**
 * DASH-05: each configurable section by its permanent id. A hidden section is
 * not rendered at all, so its own queries never start -- unless another part
 * of the page reads the same key (the readiness gate reads stats and progress,
 * Today's Workouts reads the week's routines and sessions).
 */
const SECTIONS: Record<DashboardSectionId, () => React.JSX.Element> = {
	'this-week': WeekStrip,
	stats: StatsOverview,
	'recent-activity': RecentActivity,
	'personal-records': PersonalRecords,
	'training-insights': TrainingInsights,
	'upcoming-milestones': UpcomingMilestones,
	following: FollowingPreview,
}

export default function Dashboard() {
	const { isLoading, user, progress } = useDashboardData()

	const name = user?.name?.trim()
	const [customizing, setCustomizing] = useState(false)

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
					<div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
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
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setCustomizing(true)}
						>
							<SlidersHorizontal className="size-4" aria-hidden />
							Customize
						</Button>
					</div>

					{/* Today's Workouts - dynamic based on device weekday and user routines */}
					<div className="max-w-3xl">
						<TodaysWorkouts />
					</div>

					{/*
					 * DASH-05: the member's order, with hidden sections left out.
					 * Recent Activity and Personal Records share a row from `lg`
					 * only when both are shown and adjacent. Every section below
					 * the readiness gate owns its own skeleton, so a slow read
					 * never holds the dashboard back.
					 */}
					{dashboardRows(user?.dashboardLayout).map(row => {
						if (row.kind === 'pair') {
							const [First, Second] = row.ids.map(id => SECTIONS[id])
							return (
								<div
									key={row.ids.join('+')}
									className="grid gap-8 sm:gap-12 lg:grid-cols-2"
								>
									<First />
									<Second />
								</div>
							)
						}
						const Section = SECTIONS[row.id]
						return <Section key={row.id} />
					})}
				</div>
			)}
			{customizing ? (
				<CustomizeDashboardDialog
					layout={user?.dashboardLayout}
					open
					onOpenChange={open => !open && setCustomizing(false)}
				/>
			) : null}
		</div>
	)
}
