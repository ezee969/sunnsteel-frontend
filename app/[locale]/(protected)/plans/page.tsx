'use client'

import {
	PRO_PRICE,
	REVOCATION_WINDOW_DAYS,
	SUBSCRIPTION_TRIAL_DAYS,
} from '@sunsteel/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Suspense } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { InlineError } from '@/components/layout/inline-error'
import { LoadingRows } from '@/components/layout/loading-rows'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { PlanCheckout } from '@/features/billing/plan-checkout'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useBilling } from '@/lib/api/hooks/useBilling'
import { checkoutOfferState, formatPlanPrice } from '@/lib/utils/checkout'
import { currentPlan, PLAN_ROWS } from '@/lib/utils/plans'
import { PRO_OUTCOMES } from '@/lib/utils/pro-offer'

const linkClass =
	'text-foreground underline underline-offset-4 hover:text-ink-2'

const FAQ = ['cancel', 'trial', 'refund', 'charge', 'leaving'] as const

/**
 * BILL-02 (design system §29.4) and BILL-05 (§30.2): the account's plan, then
 * -- for an account that can buy Pro -- what Pro adds as outcomes, followed by
 * `PlanCheckout`'s price, trial and Subscribe, then the questions a buyer
 * asks, and the comparison in the order of the owner's Pro split below. The
 * account's plan is the server's answer.
 */
export default function PlansPage() {
	const t = useTranslations('billing.plans')
	const tOffer = useTranslations('billing.offer')
	const locale = useLocale() as Locale
	const billing = useBilling()
	const errorText = useApiErrorMessage()
	const plan = billing.data ? currentPlan(billing.data) : null
	const offer = billing.data ? checkoutOfferState(billing.data) : null
	const canBuy = offer?.kind === 'buy' || offer?.kind === 'resume'
	const current = !plan
		? null
		: plan.kind === 'FREE'
			? t('currentFree')
			: plan.until
				? t('currentProUntil', {
						date: dateFormatter(locale, { dateStyle: 'long' }).format(
							new Date(plan.until),
						),
					})
				: t('currentPro')
	const price = formatPlanPrice(
		billing.data?.checkout.price ?? PRO_PRICE,
		locale,
	)

	const answer = (key: (typeof FAQ)[number]) => {
		switch (key) {
			case 'cancel':
				return t.rich('faq.cancel.a', {
					settings: chunks => (
						<Link href="/settings/account" className={linkClass}>
							{chunks}
						</Link>
					),
					cancellation: chunks => (
						<Link href="/baja" className={linkClass}>
							{chunks}
						</Link>
					),
				})
			case 'trial':
				return t('faq.trial.a', { days: SUBSCRIPTION_TRIAL_DAYS })
			case 'refund':
				return t.rich('faq.refund.a', {
					days: REVOCATION_WINDOW_DAYS,
					revocation: chunks => (
						<Link href="/arrepentimiento" className={linkClass}>
							{chunks}
						</Link>
					),
					refunds: chunks => (
						<Link href="/reembolsos" className={linkClass}>
							{chunks}
						</Link>
					),
				})
			case 'charge':
				return t('faq.charge.a', { price })
			case 'leaving':
				return t('downgrade')
		}
	}

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 sm:gap-8">
			<HeroSection title={<>{t('title')}</>} subtitle={<>{t('subtitle')}</>} />
			<section aria-labelledby="plans-current" className="space-y-4">
				<h2 id="plans-current" className="sr-only">
					{t('title')}
				</h2>
				{billing.isPending ? (
					<LoadingRows rows={1} label={t('title')} />
				) : billing.isError ? (
					<InlineError
						title={t('title')}
						message={errorText(billing.error)}
						onRetry={() => void billing.refetch()}
					/>
				) : (
					<p className="type-panel text-foreground">{current}</p>
				)}
				{canBuy ? (
					<div className="space-y-3">
						<h3 className="type-section text-foreground">{t('offerTitle')}</h3>
						<p className="type-body max-w-[68ch] text-ink-2">
							{tOffer('lead')}
						</p>
						<ul className="divide-y divide-rule-faint border-y border-rule">
							{PRO_OUTCOMES.map(outcome => (
								<li key={outcome.key} className="space-y-0.5 py-3">
									<p className="type-panel text-foreground">
										{tOffer(`outcomes.${outcome.key}.title`)}
									</p>
									<p className="type-body-sm max-w-[68ch] text-ink-3">
										{tOffer(`outcomes.${outcome.key}.description`)}
									</p>
								</li>
							))}
						</ul>
					</div>
				) : null}
				{/* useSearchParams needs a boundary on a page built statically. */}
				<Suspense fallback={null}>
					<PlanCheckout />
				</Suspense>
			</section>

			<section aria-labelledby="plans-faq" className="space-y-1">
				<h2
					id="plans-faq"
					className="type-section rule-row pb-2 text-foreground"
				>
					{t('faqTitle')}
				</h2>
				<Accordion type="multiple">
					{FAQ.map(key => (
						<AccordionItem key={key} value={key} className="border-rule-faint">
							<AccordionTrigger>{t(`faq.${key}.q`)}</AccordionTrigger>
							<AccordionContent>
								<p className="type-body-sm max-w-[68ch] text-ink-2">
									{answer(key)}
								</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<section aria-labelledby="plans-compare" className="space-y-3">
				<h2
					id="plans-compare"
					className="type-section rule-row pb-2 text-foreground"
				>
					{t('tableCaption')}
				</h2>
				<table className="w-full border-collapse">
					<caption className="sr-only">{t('tableCaption')}</caption>
					<thead className="max-sm:sr-only">
						<tr className="border-b border-rule">
							<th
								scope="col"
								className="type-label py-2 pr-3 text-left text-ink-3"
							>
								{t('capability')}
							</th>
							<th
								scope="col"
								className="type-label w-1/4 px-3 py-2 text-left text-ink-3"
							>
								{t('free')}
							</th>
							<th
								scope="col"
								className="type-label w-1/4 py-2 pl-3 text-left text-ink-3"
							>
								{t('pro')}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-rule-faint">
						{PLAN_ROWS.map(row => {
							const free = row.worded
								? t(`rows.${row.key}.free` as 'rows.strength.free')
								: t('none')
							const pro = row.worded
								? t(`rows.${row.key}.pro` as 'rows.strength.pro')
								: t('yes')
							return (
								<tr
									key={row.key}
									className="grid grid-cols-2 gap-x-3 py-3 sm:table-row sm:py-0"
								>
									<th
										scope="row"
										className="type-body col-span-2 pb-1 text-left font-normal text-foreground sm:py-3 sm:pr-3"
									>
										{t(`rows.${row.key}.name` as 'rows.strength.name')}
									</th>
									<td className="type-body-sm text-ink-2 sm:px-3 sm:py-3">
										<span className="type-label block text-ink-3 sm:hidden">
											{t('free')}
										</span>
										{free}
									</td>
									<td className="type-body-sm text-foreground sm:py-3 sm:pl-3">
										<span className="type-label block text-ink-3 sm:hidden">
											{t('pro')}
										</span>
										{pro}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</section>

			<section aria-labelledby="plans-always-free" className="space-y-2">
				<h2
					id="plans-always-free"
					className="type-section rule-row pb-2 text-foreground"
				>
					{t('alwaysFreeTitle')}
				</h2>
				<p className="type-body max-w-[68ch] text-ink-2">{t('alwaysFree')}</p>
			</section>
		</div>
	)
}
