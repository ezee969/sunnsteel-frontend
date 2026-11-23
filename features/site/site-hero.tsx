import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { HeroPhone } from './hero-phone'
import { HeroVideo } from './hero-video'

/**
 * SITE-01 §12.2: the first viewport. The poster is the LCP element and is
 * always there; the clip crossfades over it once it can play. The text column
 * sits over the footage's dark left side, the live-session phone stands on the
 * hero's lower edge. The scrim is baked into the footage (§33.4); higher
 * contrast adds the rest of the way to 0.75 here.
 */
export async function SiteHero() {
	const t = await getTranslations('site.hero')
	return (
		<section className="site-hero">
			<picture>
				<source
					media="(max-width: 767px)"
					type="image/avif"
					srcSet="/site/video/hero-phone-poster.avif"
				/>
				<source
					media="(max-width: 767px)"
					type="image/webp"
					srcSet="/site/video/hero-phone-poster.webp"
				/>
				<source
					type="image/avif"
					srcSet="/site/video/hero-desktop-poster.avif"
				/>
				<img
					src="/site/video/hero-desktop-poster.webp"
					alt=""
					fetchPriority="high"
					decoding="async"
					className="absolute inset-0 size-full object-cover"
				/>
			</picture>
			<HeroVideo pauseLabel={t('pauseVideo')} playLabel={t('playVideo')} />
			<div aria-hidden="true" className="site-scrim-more" />
			<div id="content" className="site-hero-text">
				<h1 className="type-site-display">
					{t.rich('headline', { mark: chunks => <mark>{chunks}</mark> })}
				</h1>
				<p className="type-site-lead site-lead">{t('subline')}</p>
				{/* One action (the owner, 2026-11-22): Sign in lives in the bar,
				    and the bar's Get started waits until this one has scrolled
				    away (`data-hero-cta`, read by the motion runtime). */}
				<div className="site-actions">
					<Link
						href="/signup"
						data-hero-cta=""
						className="site-filled site-filled-hero site-filled-accent"
					>
						{t('createAccount')}
					</Link>
				</div>
			</div>
			<HeroPhone />
		</section>
	)
}
