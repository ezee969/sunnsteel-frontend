import { FREE_STRENGTH_RANGE_DAYS, PRO_PRICE } from '@sunsteel/contracts'
import { ArrowRight, Check, Crown } from 'lucide-react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'
import { LEGAL_PATHS } from '@/lib/legal/legal-facts'
import { LANDING_FACTS } from '@/lib/site/landing-examples'
import { formatPlanPrice } from '@/lib/utils/checkout'
import { CONSUMER_REQUEST_PATHS } from '@/lib/utils/consumer-requests'
import { PRO_OUTCOMES } from '@/lib/utils/pro-offer'

import { SiteSectionHeading } from './site-parts'

/**
 * SITE-01 §12.10: what is free, what Pro adds and what it costs, plainly
 * enough that nobody signs up to a surprise (§29, §30): no countdown,
 * discount or "most popular", nothing coloured to rank the plans. Every
 * number is contracts' -- the price, the trial, the limits -- and the four
 * outcomes are the app's own. Free comes first on phones.
 */
const FREE_LINES = [
	'log',
	'progression',
	'record',
	'window',
	'social',
	'data',
] as const

export async function SitePlans() {
	const t = await getTranslations('site.plans')
	const tOutcomes = await getTranslations('billing.offer.outcomes')
	const tLegal = await getTranslations('core.legalLinks')
	const locale = (await getLocale()) as Locale
	const price = formatPlanPrice(PRO_PRICE, locale)
	const days = LANDING_FACTS.trialDays

	return (
		<section
			aria-labelledby="plans-heading"
			className="site-section"
			id="plans"
		>
			<p className="type-label text-ink-3">{t('eyebrow')}</p>
			<SiteSectionHeading id="plans-heading" className="mt-3">
				{t('heading')}
			</SiteSectionHeading>
			<div className="site-plans">
				<section aria-labelledby="plan-free" className="site-card site-plan">
					<div className="site-plan-head">
						<h3 id="plan-free" className="type-page">
							{t('free.name')}
						</h3>
						<p className="type-body-sm text-ink-2">{t('free.note')}</p>
					</div>
					<ul className="site-plan-lines">
						{FREE_LINES.map(line => (
							<li key={line}>
								<Check className="mt-0.5 size-4 shrink-0" aria-hidden />
								{t(`free.lines.${line}`, {
									days: FREE_STRENGTH_RANGE_DAYS,
									weeks: LANDING_FACTS.muscleWeeksFree,
								})}
							</li>
						))}
					</ul>
					<p className="type-body-sm text-ink-2">
						{t('free.limits', {
							versions: LANDING_FACTS.freeVersions,
							goals: LANDING_FACTS.freeGoals,
							gyms: LANDING_FACTS.freeGyms,
						})}
					</p>
					<Link
						href="/signup"
						className="type-action site-outline site-plan-action"
					>
						{t('free.action')}
					</Link>
				</section>

				<section aria-labelledby="plan-pro" className="site-card site-plan">
					<div className="site-plan-head">
						<h3
							id="plan-pro"
							className="type-page inline-flex items-center gap-2"
						>
							{t('pro.name')}
							<Crown className="size-4 text-ink-3" aria-hidden />
						</h3>
						<p className="type-body-sm text-foreground">
							<span aria-hidden="true">{t('pro.price', { price })}</span>
							<span className="sr-only">
								{t('pro.priceSr', { price, days })}
							</span>
						</p>
						<p className="type-body-sm text-ink-2">
							{t('pro.trial', { days })}
						</p>
					</div>
					<ul className="site-plan-lines">
						{PRO_OUTCOMES.map(outcome => (
							<li key={outcome.key}>
								<Check className="mt-0.5 size-4 shrink-0" aria-hidden />
								<span>
									<span className="type-panel block">
										{tOutcomes(`${outcome.key}.title`)}
									</span>
									<span className="type-body-sm text-ink-2">
										{tOutcomes(`${outcome.key}.short`)}
									</span>
								</span>
							</li>
						))}
					</ul>
					<p className="type-body-sm text-ink-2">
						{t('pro.ai', {
							drafts: LANDING_FACTS.proDrafts,
							reviews: LANDING_FACTS.proReviews,
						})}
					</p>
					<p className="type-body-sm text-ink-2">
						{t('pro.cancel')} {t('pro.paid')}.
					</p>
					<Link
						href="/signup?plan=pro"
						className="site-filled site-filled-hero site-plan-action"
					>
						{t('pro.action', { days })}
					</Link>
				</section>
			</div>
			<div className="site-plans-foot">
				<Link href="/pricing" className="type-action site-link mt-0">
					{t('compare')}
					<ArrowRight className="size-4" aria-hidden />
				</Link>
				<nav
					aria-label={tLegal('label')}
					className="site-plans-legal type-body-sm"
				>
					<Link href={LEGAL_PATHS.refunds}>{tLegal('refunds')}</Link>
					<Link href={CONSUMER_REQUEST_PATHS.CANCELLATION}>
						{tLegal('cancellation')}
					</Link>
					<Link href={CONSUMER_REQUEST_PATHS.REVOCATION}>
						{tLegal('revocation')}
					</Link>
				</nav>
			</div>
		</section>
	)
}
