'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'

import { RankCrest } from '@/features/achievements/rank-crest'

import { prefersStill } from './site-motion'
import { SiteRankHeader } from './site-rank-header'

/**
 * SITE-01 §12.7: the six ranks, each a button that dresses the "Your name"
 * header in it (the owner, 2026-11-22: a scroll-driven climb made the
 * section a long scroll, and no rank could be picked). With motion allowed,
 * the ladder also climbs by itself once when it is half in view, until a rank
 * is picked. The ranks up to the shown one are in their pigments, those
 * above in ink-3 (an unreached rank is ink-3, §19). Without JavaScript or
 * under reduced motion the header rests on Artisan, the first framed tier.
 */
export interface SiteRank {
	id: string
	title: string
	description: string
	requirement: string
}

const CLIMB_STEP_MS = 1400

export function SiteRanksStage({
	body,
	ladderLabel,
	ranks,
	restingRank,
	header,
}: {
	body: string
	ladderLabel: string
	ranks: SiteRank[]
	restingRank: string
	header: { name: string; handle: string; initials: string; example: string }
}) {
	const ladder = useRef<HTMLOListElement>(null)
	const resting = Math.max(
		0,
		ranks.findIndex(rank => rank.id === restingRank),
	)
	const [current, setCurrent] = useState(resting)
	const [picked, setPicked] = useState(false)

	// The climb: Initiate to Laureate, once per entry, until a rank is picked.
	useEffect(() => {
		if (picked || prefersStill() || !ladder.current) return
		let timers: number[] = []
		const clear = () => {
			timers.forEach(timer => window.clearTimeout(timer))
			timers = []
		}
		const watch = new IntersectionObserver(
			([entry]) => {
				if (entry.intersectionRatio >= 0.5 && timers.length === 0) {
					setCurrent(0)
					timers = ranks
						.slice(1)
						.map((_, index) =>
							window.setTimeout(
								() => setCurrent(index + 1),
								(index + 1) * CLIMB_STEP_MS,
							),
						)
				} else if (!entry.isIntersecting) {
					clear()
				}
			},
			{ threshold: [0, 0.5] },
		)
		watch.observe(ladder.current)
		return () => {
			watch.disconnect()
			clear()
		}
	}, [picked, ranks])

	const shown = ranks[current]

	return (
		<div className="site-ranks">
			<div className="site-ranks-text">
				<p className="type-site-lead site-body">{body}</p>
				<ol ref={ladder} aria-label={ladderLabel} className="site-ladder">
					{ranks.map((rank, index) => (
						<li key={rank.id} style={{ '--i': index } as CSSProperties}>
							<button
								type="button"
								aria-pressed={index === current}
								onClick={() => {
									setPicked(true)
									setCurrent(index)
								}}
								className="site-ladder-rung"
							>
								<RankCrest
									rankId={rank.id}
									reached={index <= current}
									className="site-ladder-crest size-9 shrink-0"
								/>
								<span className="min-w-0 text-left">
									<span className="type-panel block">{rank.title}</span>
									<span className="type-body-sm block text-ink-2">
										{rank.requirement}
									</span>
								</span>
							</button>
						</li>
					))}
				</ol>
			</div>
			<div className="site-ranks-header">
				<SiteRankHeader
					key={shown.id}
					rankId={shown.id}
					rankName={shown.title}
					rankDescription={shown.description}
					{...header}
				/>
			</div>
		</div>
	)
}
