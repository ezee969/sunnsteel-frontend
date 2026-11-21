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
				<div className="site-actions">
					<Link href="/signup" className="site-filled site-filled-hero">
						{t('createAccount')}
					</Link>
					<Link href="/login" className="site-ghost type-action">
						<span>{t('signIn')}</span>
					</Link>
				</div>
				<p className="site-install">
					{t.rich('install', {
						link: chunks => <Link href="/#install">{chunks}</Link>,
					})}
				</p>
			</div>
			<HeroPhone />
		</section>
	)
}
