import { getTranslations } from 'next-intl/server'
import type { CSSProperties, ReactNode } from 'react'

import { rankText } from '@/i18n/catalog'
import { RANKS } from '@/lib/site/landing-examples'

import { HeroVideo } from './hero-video'

/**
 * SITE-01 §33.15: an interlude -- a letterboxed Night band of footage between
 * two sections, carrying one line at display size and nothing to click. Chalk
 * comes before the tools ("Every rep. Written down."); the bar before the
 * ranks, with the top rank's real requirement counted up from the contracts
 * and its name striking in the rank's own pigment. The clip plays on
 * computers only, requested near the band; a phone keeps the 4:5 poster.
 * The bars close in to the 2.4:1 frame as the band scrolls into place.
 */
type Cut = 'chalk' | 'bar'

const line = (index: number) => ({ '--line': index }) as CSSProperties

function Line({ index, children }: { index: number; children: ReactNode }) {
	return (
		<span className="site-l" style={line(index)}>
			<span>{children}</span>
		</span>
	)
}

export async function SiteInterlude({ cut }: { cut: Cut }) {
	const t = await getTranslations('site.interludes')
	const tHero = await getTranslations('site.hero')
	const tRanks = await getTranslations('catalog.ranks')

	let lines: ReactNode
	if (cut === 'chalk') {
		lines = (
			<>
				<Line index={0}>{t('chalk.first')}</Line>
				<Line index={1}>
					<mark>{t('chalk.second')}</mark>
				</Line>
			</>
		)
	} else {
		const top = RANKS[RANKS.length - 1]
		const figure = (value: number) =>
			function Figure(chunks: ReactNode) {
				return (
					<span className="site-interlude-figure" data-count-up={value}>
						{chunks}
					</span>
				)
			}
		lines = (
			<>
				<Line index={0}>
					{t.rich('bar.workouts', {
						count: top.minimumSessions,
						n: figure(top.minimumSessions),
					})}
				</Line>
				<Line index={1}>
					{t.rich('bar.weeks', {
						count: top.minimumActiveWeeks,
						n: figure(top.minimumActiveWeeks),
					})}
				</Line>
				<Line index={2}>
					<mark className="site-interlude-rank">
						{t('bar.rank', { rank: rankText(top, tRanks).title })}
					</mark>
				</Line>
			</>
		)
	}

	return (
		<div
			className="dark site-night site-interlude"
			data-region="night"
			data-cut={cut}
		>
			<picture>
				<source
					media="(max-width: 767px)"
					type="image/avif"
					srcSet={`/site/video/interlude-${cut}-phone-poster.avif`}
				/>
				<source
					media="(max-width: 767px)"
					type="image/webp"
					srcSet={`/site/video/interlude-${cut}-phone-poster.webp`}
				/>
				<source
					type="image/avif"
					srcSet={`/site/video/interlude-${cut}-poster.avif`}
				/>
				<img
					src={`/site/video/interlude-${cut}-poster.webp`}
					alt=""
					loading="lazy"
					decoding="async"
					className="absolute inset-0 size-full object-cover"
				/>
			</picture>
			<HeroVideo
				cut={cut}
				pauseLabel={tHero('pauseVideo')}
				playLabel={tHero('playVideo')}
			/>
			<div aria-hidden="true" className="site-scrim-more" />
			<div aria-hidden="true" className="site-grain" />
			<p className="type-site-display site-interlude-line" data-reveal="lines">
				{lines}
			</p>
		</div>
	)
}
