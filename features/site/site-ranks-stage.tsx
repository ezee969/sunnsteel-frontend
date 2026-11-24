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
 * the phone rests on Artisan, the first framed tier. All six ranks are drawn
 * in one place on the screen and the shown one crossfades in (the owner,
 * 2026-11-23): the phone keeps the tallest one's height, so changing rank
 * never moves what is on it -- the headers share one height since ACH-11,
 * but a description of one or two lines, or a name that wraps inside
 * Laureate's border, still differ. A rank's decoration is fetched only once
 * the phone is within a screen of the viewport, and then only the shown rank
 * and the next one (or one a pointer or the keyboard reaches on the ladder):
 * fetched at page load, the six were most of the page's DOM and its main-
 * thread time (Lighthouse, 2026-11-24).
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
	const [near, setNear] = useState(false)
	const [wanted, setWanted] = useState<readonly number[]>([])
	const want = (...indexes: number[]) =>
		setWanted(previous => {
			const add = indexes.filter(
				index => index < ranks.length && !previous.includes(index),
			)
			return add.length ? [...previous, ...add] : previous
		})

	// Nothing is fetched until the phone is within a screen of the viewport.
	useEffect(() => {
		const element = phone.current
		if (!element) return
		const watch = new IntersectionObserver(
			entries => {
				if (!entries.some(entry => entry.isIntersecting)) return
				watch.disconnect()
				setNear(true)
			},
			{ rootMargin: '100% 0px' },
		)
		watch.observe(element)
		return () => watch.disconnect()
	}, [])

	// The shown rank and the one the climb shows next.
	useEffect(() => {
		if (near) want(current, current + 1)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [near, current])

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
					<div className="site-rank-stack">
						{ranks.map((rank, index) => (
							<div
								key={rank.id}
								className="site-rank-panel"
								data-shown={index === current ? '' : undefined}
							>
								<SiteRankHeader
									rankId={rank.id}
									rankName={rank.title}
									rankDescription={rank.description}
									active={index === current}
									load={wanted.includes(index)}
									{...header}
								/>
								<div className="site-rank-line">
									<div className="flex items-center gap-3">
										<RankCrest rankId={rank.id} className="size-10 shrink-0" />
										<div className="min-w-0">
											<p className="type-body-sm text-ink-3">
												{labels.current}
											</p>
											<p className="type-panel text-foreground">{rank.title}</p>
											<p className="type-body-sm tabular-nums text-ink-2">
												{rank.evidence}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3 border-t border-rule-faint pt-3">
										{rank.next ? (
											<>
												<RankCrest
													rankId={rank.next.id}
													reached={false}
													className="size-8 shrink-0"
												/>
												<div className="min-w-0">
													<p className="type-body-sm text-ink-3">
														{rank.next.label}
													</p>
													<p className="type-body-sm tabular-nums text-foreground">
														{rank.next.requirements}
													</p>
												</div>
											</>
										) : (
											<p className="type-body-sm text-ink-2">
												{labels.highest}
											</p>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</SitePhoneFrame>
			</div>
			<ol aria-label={ladderLabel} className="site-ladder site-ranks-ladder">
				{ranks.map((rank, index) => (
					<li key={rank.id} style={{ '--i': index } as CSSProperties}>
						<button
							type="button"
							aria-pressed={index === current}
							onPointerEnter={() => want(index)}
							onFocus={() => want(index)}
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
			{/* On a phone the ladder is a strip of crests and the chosen rank is
			    named here, once (the owner, 2026-11-23: six full rows under the
			    phone made the section too long). The buttons keep their names
			    for screen readers. */}
			<p aria-hidden="true" className="site-ranks-current">
				<span className="type-panel text-foreground">{shown.title}</span>
				<span className="text-ink-2"> · {shown.requirement}</span>
			</p>
		</div>
	)
}
