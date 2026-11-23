'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

import { MuscleMap } from '@/features/body-map/body-map'
import { MUSCLE_WEEKS, muscleSets } from '@/lib/site/landing-examples'
import { trainedMuscles } from '@/lib/utils/body-map'
import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'

import { prefersStill } from './site-motion'
import { ExampleMark } from './site-parts'
import { useStageStep } from './use-stage-step'

/**
 * SITE-01 §12.6: the body map's weeks, advanced by the reader. From 1024 with
 * motion the stage is sticky for about three screens and four invisible
 * markers, one per week, pass the viewport's centre (an IntersectionObserver,
 * never a scroll listener): each muscle's fill crossfades to its new band,
 * the list re-sorts, the strength line draws one more segment, the rail
 * moves; scrolling back steps back. Below 1024 the weeks play by themselves
 * when the map is half in view. Without JavaScript or under reduced motion,
 * week 4 and nothing moves. The figure and its list are `aria-hidden` while
 * they change; the final week's list is read instead.
 */
type Mode = 'still' | 'stage' | 'auto'
const WEEKS = MUSCLE_WEEKS.map((_, index) => index + 1)
const FINAL = WEEKS.length

function StrengthLine({ values, week }: { values: number[]; week: number }) {
	const min = Math.min(...values) - 0.5
	const max = Math.max(...values) + 0.5
	const points = values.map((value, index) => ({
		x: 12 + (index * 376) / (values.length - 1),
		y: 64 - ((value - min) / (max - min)) * 52,
	}))
	return (
		<svg viewBox="0 0 400 72" className="h-auto w-full" focusable="false">
			<line x1={0} x2={400} y1={71} y2={71} className="stroke-rule" />
			{points.slice(1, week).map((point, index) => (
				<line
					key={point.x}
					x1={points[index].x}
					y1={points[index].y}
					x2={point.x}
					y2={point.y}
					pathLength={1}
					className="site-segment stroke-foreground"
					strokeWidth={2}
					strokeLinecap="round"
				/>
			))}
			{points.slice(0, week).map(point => (
				<circle
					key={point.x}
					cx={point.x}
					cy={point.y}
					r={3.5}
					className="fill-foreground"
				/>
			))}
		</svg>
	)
}

export function SiteProgressStage({
	title,
	body,
	weeksLabel,
	weekLabels,
	planLine,
	strengthLabel,
	strengthValues,
	strengthLabels,
	example,
	finalListLabel,
}: {
	title: string
	body: string
	weeksLabel: string
	weekLabels: string[]
	planLine: string
	strengthLabel: string
	strengthValues: number[]
	strengthLabels: string[]
	example: string
	finalListLabel: string
}) {
	const t = useTranslations('site.progress.map')
	const tMuscles = useTranslations('routines.muscles')
	const tMap = useTranslations('progress.bodyMap')
	const scroll = useRef<HTMLDivElement>(null)
	const map = useRef<HTMLDivElement>(null)
	const [mode, setMode] = useState<Mode>('still')
	const [week, setWeek] = useState(FINAL)

	useEffect(() => {
		if (prefersStill()) return
		const next: Mode = window.matchMedia('(min-width: 1024px)').matches
			? 'stage'
			: 'auto'
		setMode(next)
		setWeek(1)
	}, [])

	// The desktop stage: a week per marker crossing the viewport's centre.
	const onStep = useCallback((step: number) => setWeek(step + 1), [])
	useStageStep(
		useCallback(() => scroll.current, []),
		'[data-week-marker]',
		mode === 'stage',
		onStep,
	)

	// Phones and tablets: the weeks play by themselves, 1.2s apart.
	useEffect(() => {
		if (mode !== 'auto' || !map.current) return
		let timers: number[] = []
		const clear = () => {
			timers.forEach(timer => window.clearTimeout(timer))
			timers = []
		}
		const watch = new IntersectionObserver(
			([entry]) => {
				if (entry.intersectionRatio >= 0.5 && timers.length === 0) {
					timers = WEEKS.slice(1).map((next, index) =>
						window.setTimeout(() => setWeek(next), (index + 1) * 1200),
					)
				} else if (!entry.isIntersecting) {
					clear()
					setWeek(1)
				}
			},
			{ threshold: [0, 0.5] },
		)
		watch.observe(map.current)
		return () => {
			watch.disconnect()
			clear()
		}
	}, [mode])

	const final = trainedMuscles(muscleSets(MUSCLE_WEEKS[FINAL - 1]))

	return (
		<div ref={scroll} className="site-progress-scroll" data-mode={mode}>
			{mode === 'stage'
				? WEEKS.map(marker => (
						<div
							key={marker}
							aria-hidden="true"
							data-week-marker=""
							className="site-week-marker"
							style={{ top: `${((marker - 1) * 100) / WEEKS.length}%` }}
						/>
					))
				: null}
			<div className="site-progress-stage">
				<div className="site-progress-text">
					<h3 className="type-panel">{title}</h3>
					<p className="type-body site-body">{body}</p>
					<div className="site-week-rail">
						<p className="type-label text-ink-3">{weeksLabel}</p>
						<ol aria-hidden="true" className="flex flex-wrap gap-1">
							{weekLabels.map((label, index) => (
								<li
									key={label}
									data-current={index + 1 === week || undefined}
									className="site-week"
								>
									{label}
								</li>
							))}
						</ol>
						<p className="type-body-sm text-ink-3">{planLine}</p>
					</div>
				</div>
				<div ref={map} className="site-progress-map">
					<div className="mb-2 flex justify-end">
						<ExampleMark label={example} />
					</div>
					<div aria-hidden="true">
						<MuscleMap
							sets={muscleSets(MUSCLE_WEEKS[week - 1])}
							emptyText={t('empty')}
							untrainedText={muscles => t('untrained', { muscles })}
						/>
					</div>
					<ul aria-label={finalListLabel} className="sr-only">
						{final.map(row => (
							<li key={row.muscle}>
								{getFriendlyMuscleName(row.muscle, tMuscles)}:{' '}
								{tMap('sets', { sets: row.sets, formatted: String(row.sets) })}
							</li>
						))}
					</ul>
				</div>
				<div className="site-strength">
					<p className="flex items-baseline justify-between gap-3">
						<span className="type-body-sm text-ink-2">{strengthLabel}</span>
						<span className="type-data-strong">{strengthLabels[week - 1]}</span>
					</p>
					<StrengthLine values={strengthValues} week={week} />
				</div>
			</div>
		</div>
	)
}
