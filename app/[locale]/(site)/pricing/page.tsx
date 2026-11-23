import {
	PRO_PRICE,
	REVOCATION_WINDOW_DAYS,
	SUBSCRIPTION_TRIAL_DAYS,
} from '@sunsteel/contracts'
import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import { PlanComparisonTable } from '@/features/billing/plan-comparison-table'
import {
	plainTags,
	SitePageHeader,
	sitePageMetadata,
	SitePageQuestions,
	SitePageSection,
	SitePageShell,
	updatedOn,
} from '@/features/site/pages/site-page'
import type { Locale } from '@/i18n/config'
import { LEGAL_PATHS } from '@/lib/legal/legal-facts'
import { LANDING_FACTS } from '@/lib/site/landing-examples'
import { formatPlanPrice } from '@/lib/utils/checkout'
import { CONSUMER_REQUEST_PATHS } from '@/lib/utils/consumer-requests'
import { PRO_OUTCOMES } from '@/lib/utils/pro-offer'

/**
 * SITE-01 §12.20: what is free, what Pro adds and what it costs, for a
 * visitor who is not signed in (a member is sent to `/plans` by the
 * middleware). The comparison is the very table `/plans` renders, the
 * outcomes and questions the app's own; every number is contracts'.
 */
const UPDATED = '2026-11'
const FAQ = ['cancel', 'trial', 'refund', 'charge', 'leaving'] as const
const WHO = ['planners', 'readers', 'ai'] as const

type Params = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale } = await params
	const t = await getTranslations({
		locale: locale as Locale,
		namespace: 'sitePages.pricing',
	})
	return sitePageMetadata({
		title: t('meta.title'),
		description: t('meta.description', {
			price: formatPlanPrice(PRO_PRICE, locale as Locale),
			days: SUBSCRIPTION_TRIAL_DAYS,
		}),
		path: '/pricing',
	})
}

export default async function PricingPage({ params }: Params) {
	const { locale } = await params
	setRequestLocale(locale as Locale)
	const t = await getTranslations('sitePages.pricing')
	const tBar = await getTranslations('site.topBar')
	const tPlans = await getTranslations('billing.plans')
	const tOffer = await getTranslations('billing.offer')
	const tSitePlans = await getTranslations('site.plans')
	const tLegal = await getTranslations('core.legalLinks')
	const price = formatPlanPrice(PRO_PRICE, locale as Locale)
	const days = SUBSCRIPTION_TRIAL_DAYS
	const crumbs = [{ label: tBar('links.pricing'), href: '/pricing' }]

	const link = (href: string) =>
		function InlineLink(chunks: ReactNode) {
			return (
				<Link href={href} className="site-inline-link">
					{chunks}
				</Link>
			)
		}
	const answers: Record<
		(typeof FAQ)[number],
		{ rich: ReactNode; plain: string }
	> = {
		cancel: {
			rich: tPlans.rich('faq.cancel.a', {
				settings: link('/settings/account'),
				cancellation: link(CONSUMER_REQUEST_PATHS.CANCELLATION),
			}),
			plain: tPlans.markup(
				'faq.cancel.a',
				plainTags(['settings', 'cancellation']),
			),
		},
		trial: {
			rich: tPlans('faq.trial.a', { days }),
			plain: tPlans('faq.trial.a', { days }),
		},
		refund: {
			rich: tPlans.rich('faq.refund.a', {
				days: REVOCATION_WINDOW_DAYS,
				revocation: link(CONSUMER_REQUEST_PATHS.REVOCATION),
				refunds: link(LEGAL_PATHS.refunds),
			}),
			plain: tPlans.markup('faq.refund.a', {
				days: REVOCATION_WINDOW_DAYS,
				...plainTags(['revocation', 'refunds']),
			}),
		},
		charge: {
			rich: tPlans('faq.charge.a', { price }),
			plain: tPlans('faq.charge.a', { price }),
		},
		leaving: { rich: tPlans('downgrade'), plain: tPlans('downgrade') },
	}

	return (
		<SitePageShell crumbs={crumbs}>
			<SitePageHeader
				crumbs={crumbs}
				eyebrow={t('eyebrow', { days })}
				title={t('heading')}
				subline={t('subline')}
				updated={updatedOn(locale as Locale, UPDATED)}
				actions={{
					primary: { label: t('tryPro', { days }), href: '/signup?plan=pro' },
					secondary: { label: t('startFree'), href: '/signup' },
				}}
				facts={[
					t('facts.price', { price }),
					t('facts.trial', { days }),
					t('facts.cancel'),
				]}
			/>

			<SitePageSection id="free" heading={t('free.heading')}>
				<p className="type-site-lead site-page-lead">{t('free.body')}</p>
				<p className="type-body site-page-note">
					<span className="type-label block text-ink-3">
						{tPlans('alwaysFreeTitle')}
					</span>
					{tPlans('alwaysFree')}
				</p>
			</SitePageSection>

			<SitePageSection id="pro" heading={t('pro.heading')}>
				<ul className="site-page-outcomes">
					{PRO_OUTCOMES.map(outcome => (
						<li key={outcome.key}>
							<Check className="mt-1 size-4 shrink-0" aria-hidden />
							<span>
								<span className="type-panel block text-foreground">
									{tOffer(`outcomes.${outcome.key}.title`)}
								</span>
								<span className="type-body text-ink-2">
									{tOffer(`outcomes.${outcome.key}.description`)}
								</span>
							</span>
						</li>
					))}
				</ul>
				<p className="type-body-sm site-page-note">
					{tSitePlans('pro.ai', {
						drafts: LANDING_FACTS.proDrafts,
						reviews: LANDING_FACTS.proReviews,
					})}
				</p>
			</SitePageSection>

			<SitePageSection id="compare" heading={t('compare.heading')}>
				<PlanComparisonTable />
				<p className="type-body-sm site-page-note">{tPlans('downgrade')}</p>
			</SitePageSection>

			<SitePageSection id="who" heading={t('who.heading')}>
				<ul className="site-page-cards">
					{WHO.map(key => (
						<li key={key} className="site-card site-page-card">
							<p className="type-body text-foreground">{t(`who.${key}`)}</p>
						</li>
					))}
				</ul>
			</SitePageSection>

			<SitePageQuestions
				items={FAQ.map(key => ({
					id: `faq-${key}`,
					question: tPlans(`faq.${key}.q`),
					answer: answers[key].rich,
					plain: answers[key].plain,
				}))}
			/>
			<nav
				aria-label={tLegal('label')}
				className="site-page-legal type-body-sm"
			>
				<Link href={LEGAL_PATHS.refunds}>{tLegal('refunds')}</Link>
				<Link href={CONSUMER_REQUEST_PATHS.CANCELLATION}>
					{tLegal('cancellation')}
				</Link>
				<Link href={CONSUMER_REQUEST_PATHS.REVOCATION}>
					{tLegal('revocation')}
				</Link>
			</nav>
		</SitePageShell>
	)
}
