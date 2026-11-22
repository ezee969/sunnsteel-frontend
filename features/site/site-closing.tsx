import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { PUBLIC_ORIGIN } from '@/lib/config/env'
import { installUrl, qrPath } from '@/lib/site/qr'

import { HeroVideo } from './hero-video'
import { HeadingWords, motionVars } from './site-parts'

/**
 * SITE-01 §12.12: the last push before the footer -- the hero's headline
 * closed into a circle, the primary action once more, and on a computer a
 * code that carries the site to the phone the visitor trains with. A Night
 * region in both themes over its own clip (desktop only, requested near the
 * band) and the poster everywhere. The code opens the landing with its
 * install helper; no page can install itself.
 */
export async function SiteClosing() {
	const t = await getTranslations('site.closing')
	const tHero = await getTranslations('site.hero')
	const url = PUBLIC_ORIGIN ? installUrl(PUBLIC_ORIGIN) : null
	const qr = url ? qrPath(url) : null

	return (
		<section
			aria-labelledby="closing-heading"
			className="dark site-night site-closing"
			data-region="night"
		>
			<picture>
				<source
					media="(max-width: 767px)"
					type="image/avif"
					srcSet="/site/video/closing-phone-poster.avif"
				/>
				<source
					media="(max-width: 767px)"
					type="image/webp"
					srcSet="/site/video/closing-phone-poster.webp"
				/>
				<source
					type="image/avif"
					srcSet="/site/video/closing-desktop-poster.avif"
				/>
				<img
					src="/site/video/closing-desktop-poster.webp"
					alt=""
					loading="lazy"
					decoding="async"
					className="absolute inset-0 size-full object-cover"
				/>
			</picture>
			<HeroVideo
				cut="closing"
				pauseLabel={tHero('pauseVideo')}
				playLabel={tHero('playVideo')}
			/>
			<div aria-hidden="true" className="site-scrim-more" />
			<div className="site-closing-inner">
				<div className="site-closing-text">
					<h2
						id="closing-heading"
						data-reveal=""
						className="type-site-heading site-heading"
					>
						<HeadingWords text={t('heading')} />
					</h2>
					<p
						className="type-site-lead site-lead"
						data-reveal="up"
						style={motionVars({ '--delay': '500ms' })}
					>
						{t('subline')}
					</p>
					<div
						className="site-actions"
						data-reveal="up"
						style={motionVars({ '--delay': '650ms', '--rise': '8px' })}
					>
						<Link href="/signup" className="site-filled site-filled-hero">
							{t('createAccount')}
						</Link>
						<Link href="/login" className="site-ghost type-action">
							<span>{t('signIn')}</span>
						</Link>
					</div>
					<p className="site-install">
						<Link href="/#install">{t('install')}</Link>
					</p>
				</div>
				{url && qr ? (
					<figure
						className="site-card site-qr"
						data-reveal="up"
						style={motionVars({ '--delay': '400ms', '--rise': '24px' })}
					>
						<figcaption className="type-panel">{t('qr.title')}</figcaption>
						<svg
							role="img"
							aria-label={t('qr.alt', { url })}
							viewBox={`0 0 ${qr.size} ${qr.size}`}
							shapeRendering="crispEdges"
							className="site-qr-code"
						>
							{/* Dark modules on a light ground, the polarity every camera
							    reads: in the Night scope the ink is the light token. */}
							<rect
								width={qr.size}
								height={qr.size}
								className="fill-foreground"
							/>
							<path d={qr.path} className="fill-background" />
						</svg>
						<p className="type-body-sm text-ink-2">{t('qr.hint')}</p>
						<p className="type-data break-all text-ink-3">{url}</p>
					</figure>
				) : null}
			</div>
		</section>
	)
}
