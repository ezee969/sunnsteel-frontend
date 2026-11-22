'use client'

import {
	type CSSProperties,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'

import { RankCrest } from '@/features/achievements/rank-crest'

import { prefersStill } from './site-motion'
import { SiteRankHeader } from './site-rank-header'
import { useStageStep } from './use-stage-step'

/**
 * SITE-01 §12.7: the climb. From 1024 with motion the section is a sticky
 * stage for about three and a half screens, and six markers, one per rank,
 * pass the viewport's centre: that rank becomes current, its crest and the
 * ones below it draw in their pigments while those above stay in ink-3 (an
 * unreached rank is ink-3, §19), and the profile header changes to that
 * rank's decoration, which plays its own entrance. Scrolling back steps
 * back. Elsewhere -- phones, tablets, reduced motion, no JavaScript -- the
 * ladder is all drawn and the header wears Artisan, the first framed tier.
 */
export interface SiteRank {
	id: string
	title: string
	description: string
	requirement: string
}

type Mode = 'still' | 'stage'

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
	const scroll = useRef<HTMLDivElement>(null)
	const [mode, setMode] = useState<Mode>('still')
	const resting = Math.max(
		0,
		ranks.findIndex(rank => rank.id === restingRank),
	)
	const [current, setCurrent] = useState(resting)

	useEffect(() => {
		if (prefersStill() || !window.matchMedia('(min-width: 1024px)').matches)
			return
		setMode('stage')
		setCurrent(0)
	}, [])

	useStageStep(
		useCallback(() => scroll.current, []),
		'[data-rank-marker]',
		mode === 'stage',
		setCurrent,
	)

	const shown = ranks[current]
	const reached = (index: number) => mode === 'still' || index <= current

	return (
		<div ref={scroll} className="site-ranks-scroll" data-mode={mode}>
			{mode === 'stage'
				? ranks.map((rank, index) => (
						<div
							key={rank.id}
							aria-hidden="true"
							data-rank-marker=""
							className="site-rank-marker"
							style={{ top: `${(index * 100) / ranks.length}%` }}
						/>
					))
				: null}
			<div className="site-ranks">
				<div className="site-ranks-text">
					<p className="type-site-lead site-body">{body}</p>
					<ol
						aria-label={ladderLabel}
						className="site-ladder"
						data-play-when="0.5"
					>
						{ranks.map((rank, index) => (
							<li
								key={rank.id}
								className="site-ladder-rung"
								data-current={
									(mode === 'stage' && index === current) || undefined
								}
								style={{ '--i': index } as CSSProperties}
							>
								<RankCrest
									rankId={rank.id}
									reached={reached(index)}
									className="site-ladder-crest size-9 shrink-0"
								/>
								<div className="min-w-0">
									<p className="type-panel">{rank.title}</p>
									<p className="type-body-sm text-ink-2">{rank.requirement}</p>
								</div>
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
		</div>
	)
}
