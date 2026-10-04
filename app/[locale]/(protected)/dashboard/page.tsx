'use client'

import type { DashboardSectionId } from '@sunsteel/contracts'
import { SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { useUpdateOnboarding } from '@/lib/api/hooks/useOnboarding'
import { pendingSteps, shouldOpenWelcome } from '@/lib/onboarding/steps'
import { dashboardRows } from '@/lib/utils/dashboard-layout'

import { CustomizeDashboardDialog } from './components/CustomizeDashboardDialog'
import DashboardGoals from './components/DashboardGoals'
import DashboardLoading from './components/DashboardLoading'
import DashboardRank from './components/DashboardRank'
import FollowingPreview from './components/FollowingPreview'
import GettingStarted from './components/GettingStarted'
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
	goals: DashboardGoals,
	stats: StatsOverview,
	'recent-activity': RecentActivity,
	'personal-records': PersonalRecords,
	'training-insights': TrainingInsights,
	'upcoming-milestones': UpcomingMilestones,
	following: FollowingPreview,
}

export default function Dashboard() {
	const t = useTranslations('planning.dashboardPage')
	const { isLoading, user, progress, gettingStarted, layout, steps } =
		useDashboardData()

	const name = user?.name?.trim()
	const [customizing, setCustomizing] = useState(false)
	const tOnboarding = useTranslations('onboarding.notice')
	const router = useRouter()
	const updateOnboarding = useUpdateOnboarding()
	const opened = useRef(false)
	// ONBOARD-01: a new account's first visit opens onboarding once; it is
	// recorded first, so it never opens by itself again on any device.
	useEffect(() => {
		if (opened.current || !shouldOpenWelcome(user?.onboarding)) return
		opened.current = true
		updateOnboarding.mutate({ offered: true })
		router.push('/welcome')
	}, [user, updateOnboarding, router])
	// A member past getting started is offered steps added since their
	// version here; a new account resumes from Getting started instead.
	const newSetupSteps = steps ? 0 : pendingSteps(user?.onboarding).length

	return (
		// v1.1 §26.4: the inscription, the greeting and the rank read as one
		// masthead, closer to each other than the regions below them are.
		<div className="flex flex-col gap-3 sm:gap-8">
			{/* Classical Hero — static, so it paints immediately */}
			<HeroSection title={t('heroTitle')} subtitle={t('heroSubtitle')} />

			{/*
			 * Everything below is gated on one readiness flag so the dashboard
			 * arrives as a single composed view instead of assembling itself
			 * section by section.
			 */}
			{progress.bootstrapError ? (
				<div role="alert" className="flex flex-col items-start gap-3">
					<p className="type-body-sm text-foreground">{t('bootstrapError')}</p>
					<Button
						onClick={() => {
							void progress.retryBootstrap().catch(() => undefined)
						}}
					>
						{t('retry')}
					</Button>
				</div>
			) : isLoading ? (
				<DashboardLoading />
			) : (
				// §9.2 — no page-level entrance animation. The whole dashboard used
				// to fade and rise on every visit, which delays perceived load and is
				// the exact trope the plan forbids.
				<div className="flex flex-col gap-8 sm:gap-12">
					<div className="flex flex-col gap-3 sm:gap-6">
						{/* The greeting wraps inside its own column so Customize keeps its
					    place beside it on a phone, rather than dropping to a row of
					    its own under the wider body face (UX-14). */}
						<div className="flex items-start justify-between gap-x-4 sm:gap-x-6">
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								{/* The masthead above already carries the page rank, so the
						    greeting is a panel title rather than a second inscription
						    competing with it (§5.3 — Cinzel appears at most twice, and
						    the inline font-family override went with the old rank). */}
								<p className="type-panel text-foreground">
									{name ? t('welcomeNamed', { name }) : t('welcome')}
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setCustomizing(true)}
							>
								<SlidersHorizontal className="size-4" aria-hidden />
								{t('customize')}
							</Button>
						</div>

						{/* DASH-11: the rank is part of the masthead, not a DASH-05 section,
					    so it is never hidden or moved. */}
						<DashboardRank />
					</div>

					{/* Today's Workouts - dynamic based on device weekday and user routines */}
					<div className="max-w-3xl">
						<TodaysWorkouts />
					</div>

					{newSetupSteps > 0 ? (
						<p className="type-body-sm max-w-3xl text-ink-2">
							{tOnboarding('text', { count: newSetupSteps })}{' '}
							<Link
								href="/welcome"
								className="text-foreground underline underline-offset-4"
							>
								{tOnboarding('action')}
							</Link>
						</p>
					) : null}

					{/* UX-19: a new account's three first steps, under the one
					    primary action rather than competing with it. */}
					{steps ? (
						<div className="max-w-3xl">
							<GettingStarted steps={steps} />
						</div>
					) : null}

					{/*
					 * DASH-05: the member's order, with hidden sections left out.
					 * UX-19: a getting-started account's default also leaves out
					 * the sections that have nothing to show yet.
					 * Recent Activity and Personal Records share a row from `lg`
					 * only when both are shown and adjacent. Every section below
					 * the readiness gate owns its own skeleton, so a slow read
					 * never holds the dashboard back.
					 */}
					{dashboardRows(layout).map(row => {
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
					gettingStarted={gettingStarted}
					open
					onOpenChange={open => !open && setCustomizing(false)}
				/>
			) : null}
		</div>
	)
}
