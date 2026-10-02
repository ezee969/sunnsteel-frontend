'use client'

import { ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useDisplayPreference } from '@/hooks/use-display-preference'
import type { Locale } from '@/i18n/config'
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
	const t = useTranslations('workout.sessionHeader')
	const locale = useLocale() as Locale
	const { completedSets, totalSets, percentage } = progressData
	// LIVE-18: the gym is where larger controls are needed, so the switch is
	// here as well as in Settings. It is the same device choice, not a mode.
	const { largeControls, setControlSize } = useDisplayPreference()
	const isComplete = percentage === 100
	const duration = formatDuration(
		Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
	)

	return (
		// The page inscription. This is the one double rule on the screen
		// (design system §11.2) — nothing else below it uses one. Opaque, not
		// translucent: nothing in v0.1 is glass.
		// v1.1 §26.3: pinned flush under the topbar and across <main>'s whole
		// width, so sets scrolled beneath it never show above or beside it.
		<div className="rule-heading shell-pin shell-bleed z-20 bg-background">
			<div className="ledger-page py-3">
				<div className="flex items-center justify-between gap-4">
					{/* Left side - Navigation and title */}
					<div className="flex min-w-0 items-center gap-3">
						<Button
							variant="ghost"
							size="sm"
							onClick={onNavigateBack}
							aria-label={t('back')}
							className="-ml-2 size-11 rounded-sm p-2 text-ink-2 hover:bg-muted hover:text-foreground md:size-9"
						>
							<ArrowLeft className="h-4 w-4" aria-hidden />
						</Button>
						<div className="min-w-0">
							{/* The one classical device the direction keeps: gold brackets,
							    one pair per screen, on the inscription. */}
							{/* §11.11 / v1.1 §26.4: the inscription wraps -- three lines on
							    a phone, two to `lg` -- rather than clamping beside the
							    progress figure. */}
							<h1 className="corner-brackets type-section line-clamp-3 text-foreground sm:line-clamp-2 lg:line-clamp-1">
								{routineName}
							</h1>
							<p className="type-body-sm text-ink-2">{dayName}</p>
						</div>
					</div>

					{/* Right side - Status and stats. Labels above mono values, so the
					    figures are the scannable rank rather than their captions. */}
					<div className="flex shrink-0 items-center gap-6">
						<div className="hidden text-right sm:block">
							<p className="type-body-sm text-ink-3">{t('elapsed')}</p>
							<p className="type-data text-foreground">{duration}</p>
						</div>

						<div className="hidden text-right sm:block">
							<p className="type-body-sm text-ink-3">{t('sets')}</p>
							<p className="type-data text-foreground">
								{completedSets}/{totalSets}
							</p>
						</div>

						{/* The screen's one statement of overall progress (§11.8).
						    Completion is "done, as planned", so it is --success, not
						    gold (§4.3 rule 2). */}
						<div className="text-right">
							<p className="type-body-sm text-ink-3">
								{isComplete ? t('complete') : t('progress')}
							</p>
							<p
								className={`type-data type-data-strong ${
									isComplete ? 'text-success' : 'text-foreground'
								}`}
							>
								{Math.round(percentage)}%
							</p>
						</div>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-pressed={largeControls}
							aria-label={t('largerControlsAria')}
							title={
								largeControls ? t('largerControlsOn') : t('largerControlsOff')
							}
							className={
								'size-11 md:size-10 ' +
								(largeControls ? 'border border-rule bg-muted' : '')
							}
							onClick={() =>
								setControlSize(largeControls ? 'standard' : 'large')
							}
						>
							{largeControls ? (
								<ZoomOut className="size-5" aria-hidden />
							) : (
								<ZoomIn className="size-5" aria-hidden />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile stats row */}
				<div className="mt-3 flex items-center justify-between border-t border-rule-faint pt-2 sm:hidden">
					<div>
						<p className="type-body-sm text-ink-3">{t('elapsed')}</p>
						<p className="type-data text-foreground">{duration}</p>
					</div>
					<div>
						<p className="type-body-sm text-ink-3">{t('sets')}</p>
						<p className="type-data text-foreground">
							{completedSets}/{totalSets}
						</p>
					</div>
					<div className="text-right">
						<p className="type-body-sm text-ink-3">{t('started')}</p>
						<p className="type-data text-foreground">
							{formatTime(startedAt, locale)}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
