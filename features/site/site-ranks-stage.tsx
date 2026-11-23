'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'

import { RankCrest } from '@/features/achievements/rank-crest'

import { prefersStill } from './site-motion'
import { SitePhoneFrame } from './site-parts'
import { SiteRankHeader } from './site-rank-header'

/**
 * SITE-01 §12.7: the six ranks, each a button that dresses the phone's
 * profile in it (the owner, 2026-11-22: a scroll-driven climb made the
 * section a long scroll, and no rank could be picked; then the header,
 * standing alone beside the ladder, looked unplaced -- an undecorated rank
 * has no frame to hold it -- so it moved onto a phone's screen, over the
 * dashboard's rank line). With motion allowed, the ladder also climbs by
 * itself once when the phone is mostly in view, until a rank is picked. The
 * ranks up to the shown one are in their pigments, those above in ink-3 (an
 * unreached rank is ink-3, §19). Without JavaScript or under reduced motion
 * the phone rests on Artisan, the first framed tier.
 */
export interface SiteRank {
	id: string
	title: string
	description: string
	requirement: string
	/** The dashboard's evidence line, for a member exactly on this rank. */
	evidence: string
	next: { id: string; label: string; requirements: string } | null
}

const CLIMB_STEP_MS = 1200

export function SiteRanksStage({
	body,
	ladderLabel,
	ranks,
	restingRank,
	labels,
	header,
}: {
	body: string
	ladderLabel: string
	ranks: SiteRank[]
	restingRank: string
	labels: { current: string; highest: string }
	header: { name: string; handle: string; initials: string }
}) {
	const phone = useRef<HTMLDivElement>(null)
	const resting = Math.max(
		0,
		ranks.findIndex(rank => rank.id === restingRank),
	)
	const [current, setCurrent] = useState(resting)
	const [picked, setPicked] = useState(false)

	// The climb: Initiate to Laureate, once per entry, until a rank is picked.
	useEffect(() => {
		if (picked || prefersStill() || !phone.current) return
		let timers: number[] = []
		const clear = () => {
			timers.forEach(timer => window.clearTimeout(timer))
			timers = []
		}
		const watch = new IntersectionObserver(
			([entry]) => {
				if (entry.intersectionRatio >= 0.6 && timers.length === 0) {
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
			{ threshold: [0, 0.6] },
		)
		watch.observe(phone.current)
		return () => {
			watch.disconnect()
			clear()
		}
	}, [picked, ranks])

	const shown = ranks[current]

	return (
		<div className="site-ranks">
			<p className="type-site-lead site-body site-ranks-body">{body}</p>
			<div
				ref={phone}
				className="site-ranks-phone"
				// The pool of light behind the phone takes the shown rank's pigment.
				style={
					{
						'--site-rank': `var(--rank-${shown.id.toLowerCase()})`,
					} as CSSProperties
				}
			>
				<SitePhoneFrame className="site-rank-phone">
					<SiteRankHeader
						key={shown.id}
						rankId={shown.id}
						rankName={shown.title}
						rankDescription={shown.description}
						{...header}
					/>
					<div className="site-rank-line">
						<div className="flex items-center gap-3">
							<RankCrest rankId={shown.id} className="size-10 shrink-0" />
							<div className="min-w-0">
								<p className="type-body-sm text-ink-3">{labels.current}</p>
								<p className="type-panel text-foreground">{shown.title}</p>
								<p className="type-body-sm tabular-nums text-ink-2">
									{shown.evidence}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3 border-t border-rule-faint pt-3">
							{shown.next ? (
								<>
									<RankCrest
										rankId={shown.next.id}
										reached={false}
										className="size-8 shrink-0"
									/>
									<div className="min-w-0">
										<p className="type-body-sm text-ink-3">
											{shown.next.label}
										</p>
										<p className="type-body-sm tabular-nums text-foreground">
											{shown.next.requirements}
										</p>
									</div>
								</>
							) : (
								<p className="type-body-sm text-ink-2">{labels.highest}</p>
							)}
						</div>
					</div>
				</SitePhoneFrame>
			</div>
			<ol aria-label={ladderLabel} className="site-ladder site-ranks-ladder">
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
	)
}
