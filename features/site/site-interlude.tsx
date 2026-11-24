import { getTranslations } from 'next-intl/server'
import type { CSSProperties, ReactNode } from 'react'

import { HeroVideo } from './hero-video'

/**
 * SITE-01 §33.15: an interlude -- a letterboxed Night band of footage between
 * two sections, carrying one line at display size and nothing to click. Chalk
 * comes before the tools; the bar's band before the ranks was removed by the
 * owner on 2026-11-23 (it repeated the ranks section that follows it). The
 * clip plays on computers only, requested near the band; a phone keeps the
 * 4:5 poster. The bars close in to the 2.4:1 frame as the band scrolls into
 * place.
 */
type Cut = 'chalk'

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

	const lines = (
		<>
			<Line index={0}>{t(`${cut}.first`)}</Line>
			<Line index={1}>
				<mark>{t(`${cut}.second`)}</mark>
			</Line>
		</>
	)

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
