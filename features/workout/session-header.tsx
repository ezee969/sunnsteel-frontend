'use client'

import { ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDisplayPreference } from '@/hooks/use-display-preference'
import type { Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'
import { formatDuration, formatTime } from '@/lib/utils/time-format.utils'
import type { SessionProgressData } from '@/lib/utils/workout-session.types'

interface SessionHeaderProps {
	routineName: string
	dayName: string
	startedAt: string
	progressData: SessionProgressData
	/** LIVE-22: every required set is done, so Finish becomes the one filled control. */
	canFinish: boolean
	isFinishing: boolean
	onFinishAttempt: () => void
	onNavigateBack: () => void
}

/**
 * The live workout's masthead: the title, the time, the one statement of how
 * far the workout has come and, from `md`, Finish (design system §27.5).
 */
export const SessionHeader = ({
	routineName,
	dayName,
	startedAt,
	progressData,
	canFinish,
	isFinishing,
	onFinishAttempt,
	onNavigateBack,
}: SessionHeaderProps) => {
	const t = useTranslations('workout.sessionHeader')
	const tActions = useTranslations('workout.sessionActionCard')
	const locale = useLocale() as Locale
	const { completedSets, totalSets, percentage } = progressData
	// LIVE-18: the gym is where larger controls are needed, so the switch is
	// here as well as in Settings. It is the same device choice, not a mode.
	const { largeControls, setControlSize } = useDisplayPreference()
	// LIVE-22: the elapsed time ticks on its own; it used to move only when
	// something else re-rendered the page, so it froze between rests.
	const [now, setNow] = useState(() => Date.now())
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(timer)
	}, [])
	const duration = formatDuration(
		Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)),
	)
	const setsDone = t('setsDone', { completed: completedSets, total: totalSets })

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
							{/* LIVE-22 (§27.5): never clamped. A clamp truncated the title in
							    Spanish at 320; §11.11 says an inscription wraps. */}
							<h1 className="corner-brackets type-section text-foreground">
								{routineName}
							</h1>
							<p className="type-body-sm text-ink-2">{dayName}</p>
						</div>
					</div>

					{/* Right side - Status and stats. Labels above mono values, so the
					    figures are the scannable rank rather than their captions. */}
					<div className="flex shrink-0 items-center gap-4 lg:gap-6">
						<div className="hidden text-right sm:block">
							<p className="type-body-sm text-ink-3">{t('elapsed')}</p>
							{/* §5.4 (UX-24): the elapsed string changes length as it
							    ticks, so it renders in a reserved slot. */}
							<p className="type-data duration-slot text-right text-foreground">
								{duration}
							</p>
						</div>

						{/* §11.8 / §27.5: the screen's one statement of how far the
						    workout has come -- sets done of all, with the bar below. */}
						<div className="hidden text-right sm:block">
							<p className="type-body-sm text-ink-3">{t('sets')}</p>
							<p className="type-data text-foreground">{setsDone}</p>
						</div>

						{/* §27.5: Finish sits in the masthead from `md`, outline until the
						    required sets are done, then the screen's one filled control. */}
						<Button
							type="button"
							variant={canFinish ? 'default' : 'outline'}
							onClick={onFinishAttempt}
							disabled={isFinishing}
							className="hidden md:inline-flex"
						>
							{isFinishing ? tActions('finishing') : tActions('finishSession')}
						</Button>

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
						<p className="type-data duration-slot text-foreground">
							{duration}
						</p>
					</div>
					<div>
						<p className="type-body-sm text-ink-3">{t('sets')}</p>
						<p className="type-data text-foreground">{setsDone}</p>
					</div>
					<div className="text-right">
						<p className="type-body-sm text-ink-3">{t('started')}</p>
						<p className="type-data text-foreground">
							{formatTime(startedAt, locale)}
						</p>
					</div>
				</div>

				{/* §27.5: a 2px bar under the figures -- ink while sets remain, the
				    completion mark once they are all done (§4.3 rule 2). The bar
				    keeps the primitive's progressbar role; its name is the line
				    above it. */}
				<Progress
					value={percentage}
					aria-label={t('progressAria', {
						completed: completedSets,
						total: totalSets,
					})}
					className={cn(
						'mt-3 h-0.5',
						percentage === 100 &&
							'[&_[data-slot=progress-indicator]]:bg-success-strong',
					)}
				/>
			</div>
		</div>
	)
}
