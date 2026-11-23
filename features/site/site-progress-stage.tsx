'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { MuscleMap } from '@/features/body-map/body-map'
import { MUSCLE_WEEKS, muscleSets } from '@/lib/site/landing-examples'

import { prefersStill } from './site-motion'

/**
 * SITE-01 §12.6: the body map's weeks. The week buttons are the reader's
 * (the owner, 2026-11-22: a scroll-driven stage made the section a long
 * scroll and nothing could be picked); with motion allowed, the four weeks
 * also play by themselves once the map is half in view, until a week is
 * picked. Each muscle's fill crossfades to its band, the list re-sorts and
 * the strength line draws a segment a week. Without JavaScript or under
 * reduced motion it shows week 4 and plays nothing.
 */
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
}: {
	title: string
	body: string
	weeksLabel: string
	weekLabels: string[]
	planLine: string
	strengthLabel: string
	strengthValues: number[]
	strengthLabels: string[]
}) {
	const t = useTranslations('site.progress.map')
	const map = useRef<HTMLDivElement>(null)
	const [week, setWeek] = useState(FINAL)
	// Once the reader picks a week, the map is theirs: nothing plays over it.
	const [picked, setPicked] = useState(false)

	// The weeks play by themselves, 1.2s apart, when the map is half in view
	// (once per entry), with motion allowed and nothing picked yet.
	useEffect(() => {
		if (picked || prefersStill() || !map.current) return
		setWeek(1)
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
	}, [picked])

	const pick = (next: number) => {
		setPicked(true)
		setWeek(next)
	}

	return (
		<div className="site-progress-stage">
			<div className="site-progress-text">
				<h3 className="type-panel">{title}</h3>
				<p className="type-body site-body">{body}</p>
				<div className="site-week-rail">
					<p className="type-label text-ink-3" id="site-weeks-label">
						{weeksLabel}
					</p>
					<div
						role="group"
						aria-labelledby="site-weeks-label"
						className="flex flex-wrap gap-1"
					>
						{weekLabels.map((label, index) => (
							<button
								key={label}
								type="button"
								aria-pressed={index + 1 === week}
								onClick={() => pick(index + 1)}
								className="site-week"
							>
								{label}
							</button>
						))}
					</div>
					<p className="type-body-sm text-ink-3">{planLine}</p>
				</div>
			</div>
			<div ref={map} className="dark site-progress-map">
				<MuscleMap
					sets={muscleSets(MUSCLE_WEEKS[week - 1])}
					emptyText={t('empty')}
					untrainedText={muscles => t('untrained', { muscles })}
				/>
			</div>
			<div className="dark site-strength">
				<p className="flex items-baseline justify-between gap-3">
					<span className="type-body-sm text-ink-2">{strengthLabel}</span>
					<span className="type-data-strong">{strengthLabels[week - 1]}</span>
				</p>
				<StrengthLine values={strengthValues} week={week} />
			</div>
		</div>
	)
}
