'use client'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatDuration, formatTime } from '@/lib/utils/time-format.utils'
import type { SessionProgressData } from '@/lib/utils/workout-session.types'

interface SessionHeaderProps {
	routineName: string
	dayName: string
	startedAt: string
	progressData: SessionProgressData
	onNavigateBack: () => void
}

/**
 * Header component for workout session pages with navigation and status
 */
export const SessionHeader = ({
	routineName,
	dayName,
	startedAt,
	progressData,
	onNavigateBack,
}: SessionHeaderProps) => {
	const { completedSets, totalSets, percentage } = progressData
	const isComplete = percentage === 100
	const duration = formatDuration(
		Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
	)

	return (
		// The page inscription. This is the one double rule on the screen
		// (design system §11.2) — nothing else below it uses one. Opaque, not
		// translucent: nothing in v0.1 is glass.
		<div className="rule-heading sticky top-0 z-20 bg-background">
			<div className="ledger-page py-3">
				<div className="flex items-center justify-between gap-4">
					{/* Left side - Navigation and title */}
					<div className="flex min-w-0 items-center gap-3">
						<Button
							variant="ghost"
							size="sm"
							onClick={onNavigateBack}
							className="-ml-2 rounded-sm p-2 text-ink-2 hover:bg-muted hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<div className="min-w-0">
							{/* The one classical device the direction keeps: gold brackets,
							    one pair per screen, on the inscription. */}
							<h1 className="corner-brackets type-section line-clamp-1 text-foreground">
								{routineName}
							</h1>
							<p className="type-label mt-1 text-ink-3">{dayName}</p>
						</div>
					</div>

					{/* Right side - Status and stats. Labels above mono values, so the
					    figures are the scannable rank rather than their captions. */}
					<div className="flex shrink-0 items-center gap-6">
						<div className="hidden text-right sm:block">
							<p className="type-label text-ink-3">Elapsed</p>
							<p className="type-data text-foreground">{duration}</p>
						</div>

						<div className="hidden text-right sm:block">
							<p className="type-label text-ink-3">Sets</p>
							<p className="type-data text-foreground">
								{completedSets}/{totalSets}
							</p>
						</div>

						{/* Completion is an earned mark, so it is the one thing here that
						    may take gold (§4.3 rule 2). */}
						<div className="text-right">
							<p className="type-label text-ink-3">
								{isComplete ? 'Complete' : 'Progress'}
							</p>
							<p
								className={`type-data type-data-strong ${
									isComplete ? 'text-honour' : 'text-foreground'
								}`}
							>
								{Math.round(percentage)}%
							</p>
						</div>
					</div>
				</div>

				{/* Mobile stats row */}
				<div className="mt-3 flex items-center justify-between border-t border-rule-faint pt-2 sm:hidden">
					<div>
						<p className="type-label text-ink-3">Elapsed</p>
						<p className="type-data text-foreground">{duration}</p>
					</div>
					<div>
						<p className="type-label text-ink-3">Sets</p>
						<p className="type-data text-foreground">
							{completedSets}/{totalSets}
						</p>
					</div>
					<div className="text-right">
						<p className="type-label text-ink-3">Started</p>
						<p className="type-data text-foreground">{formatTime(startedAt)}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
