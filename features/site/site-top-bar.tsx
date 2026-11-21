import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { SunnsteelLockup } from '@/components/brand/sunnsteel-lockup'

import { LanguageSwitch } from './language-switch'
import { SiteMenu } from './site-menu'

/**
 * SITE-01 §12.1: the public site's bar, transparent over the hero with the
 * Night tokens (the hero's `.dark` scope). Until the Product panel is built
 * (the sections phase), Product is a link to /features -- the bar's own
 * no-JavaScript behaviour.
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
				<Link href="/features" className="inline-flex items-center gap-1">
					{t('product')}
					<ChevronDown className="size-3.5" aria-hidden />
				</Link>
				<Link href="/pricing">{t('pricing')}</Link>
			</nav>
			<div className="site-bar-actions">
				<LanguageSwitch
					label={t('language')}
					names={{ en: t('english'), es: t('spanish') }}
				/>
				<Link href="/login" className="type-action text-foreground">
					{t('signIn')}
				</Link>
				<Link href="/signup" className="site-filled site-filled-bar">
					{t('start')}
				</Link>
				<SiteMenu />
			</div>
		</header>
	)
}
