import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { SunnsteelLockup } from '@/components/brand/sunnsteel-lockup'
import { LEGAL_PATHS, SELLER } from '@/lib/legal/legal-facts'
import { CONSUMER_REQUEST_PATHS } from '@/lib/utils/consumer-requests'

import { LanguageSwitch } from './language-switch'

/**
 * SITE-01 §12.13: every public page's way out -- the site map, help, the
 * legal pages and, on the bottom row, the two buttons Argentina's consumer
 * law asks for on every signed-out surface (BILL-07), named as the law names
 * them. No seller identification here (the owner's decision). Chrome does
 * not perform: no motion. Column titles are labels, not headings.
 */
export async function SiteFooter() {
	const t = await getTranslations('site.footer')
	const tBar = await getTranslations('site.topBar')
	const tLegal = await getTranslations('core.legalLinks')

	const columns = [
		{
			id: 'product',
			links: [
				[tBar('links.allFeatures'), '/features'],
				[tBar('links.workoutTracker'), '/features/workout-tracker'],
				[tBar('links.routineBuilder'), '/features/routine-builder'],
				[tBar('links.progression'), '/features/progression'],
				[tBar('links.progress'), '/features/progress'],
				[tBar('links.ranks'), '/features/ranks'],
				[tBar('links.community'), '/features/community'],
				[tBar('links.pricing'), '/pricing'],
			],
		},
		{
			id: 'useCases',
			links: [
				[tBar('links.beginners'), '/use-cases/beginners'],
				[tBar('links.intermediates'), '/use-cases/intermediates'],
				[tBar('links.advanced'), '/use-cases/advanced'],
			],
		},
		{
			id: 'help',
			links: [
				[t('links.questions'), '/#questions'],
				[t('links.install'), '/#install'],
				[t('links.contact'), `mailto:${SELLER.email}`],
			],
		},
		{
			id: 'legal',
			links: [
				[t('links.terms'), LEGAL_PATHS.terms],
				[t('links.privacy'), LEGAL_PATHS.privacy],
				[t('links.refunds'), LEGAL_PATHS.refunds],
			],
		},
	] as const

	return (
		<footer className="site-footer">
			<div className="site-footer-inner">
				<div className="site-footer-brand">
					<Link href="/" aria-label={tBar('home')} className="text-foreground">
						<SunnsteelLockup
							className="site-lockup"
							markClassName="site-lockup-mark"
						/>
					</Link>
					<p className="type-body-sm text-ink-2">{t('tagline')}</p>
				</div>
				<nav aria-label={t('navLabel')} className="site-footer-nav">
					{columns.map(column => (
						<div key={column.id}>
							<p className="type-label text-ink-3">
								{t(`columns.${column.id}`)}
							</p>
							<ul>
								{column.links.map(([label, href]) => (
									<li key={href}>
										<Link href={href} className="site-footer-link">
											{label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</nav>
			</div>
			<div className="site-footer-bottom">
				<nav aria-label={tLegal('label')} className="site-footer-legal">
					<Link
						href={CONSUMER_REQUEST_PATHS.REVOCATION}
						className="site-footer-link"
					>
						{tLegal('revocation')}
					</Link>
					<Link
						href={CONSUMER_REQUEST_PATHS.CANCELLATION}
						className="site-footer-link"
					>
						{tLegal('cancellation')}
					</Link>
				</nav>
				<LanguageSwitch
					label={tBar('language')}
					names={{ en: tBar('english'), es: tBar('spanish') }}
				/>
				<p className="type-body-sm text-ink-3">
					{/* A string, so the year is never grouped (2,026). */}
					{t('copyright', { year: String(new Date().getFullYear()) })}
				</p>
			</div>
		</footer>
	)
}
