import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { SunnsteelLockup } from '@/components/brand/sunnsteel-lockup'

import { LanguageSwitch } from './language-switch'
import { SiteMenu } from './site-menu'
import { SITE_NAV_GROUPS } from './site-nav-groups'

/**
 * SITE-01 §12.1: the public site's bar, transparent over the hero with the
 * Night tokens (the hero's `.dark` scope). From 768 Product opens its panel
 * on hover or focus; the link itself goes to /features, the bar's
 * no-JavaScript behaviour. Below 1024 Sign in holds the bar until Get
 * started takes its place (the owner, 2026-11-23: a returning member found
 * no way in on a phone); the menu lists it first.
 */
export async function SiteTopBar() {
	const t = await getTranslations('site.topBar')
	return (
		<header className="site-bar dark">
			<a href="#content" className="site-skip type-action">
				{t('skip')}
			</a>
			<Link href="/" aria-label={t('home')} className="text-foreground">
				<SunnsteelLockup
					className="site-lockup"
					markClassName="site-lockup-mark"
				/>
			</Link>
			<nav aria-label={t('navLabel')} className="site-nav">
				{/* Product opens its panel on hover or focus, as Boostcamp's bar
				    does (the owner, 2026-11-23) -- CSS only, so it works before
				    JavaScript; the link itself still goes to /features. */}
				<div className="site-product">
					<Link href="/features" className="site-product-trigger">
						{t('product')}
						<ChevronDown
							className="site-product-chevron size-3.5"
							aria-hidden
						/>
					</Link>
					<div className="site-product-panel dark">
						<div className="site-product-inner">
							{SITE_NAV_GROUPS.map(group => (
								<div key={group.id}>
									<p className="site-product-label">
										{t(`columns.${group.id}`)}
									</p>
									<ul>
										{group.links.map(([key, href]) => (
											<li key={key}>
												<Link href={href} className="site-product-link">
													{t(`links.${key}`)}
												</Link>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>
				</div>
				<Link href="/pricing">{t('pricing')}</Link>
			</nav>
			<div className="site-bar-actions">
				<LanguageSwitch
					label={t('language')}
					names={{ en: t('english'), es: t('spanish') }}
				/>
				<Link
					prefetch={false}
					href="/login"
					className="site-bar-signin type-action text-foreground"
				>
					{t('signIn')}
				</Link>
				<Link
					prefetch={false}
					href="/signup"
					className="site-filled site-filled-bar site-filled-accent"
				>
					{t('start')}
				</Link>
				<SiteMenu />
			</div>
		</header>
	)
}
