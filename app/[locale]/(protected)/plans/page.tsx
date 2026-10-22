'use client'

import { useLocale, useTranslations } from 'next-intl'

import HeroSection from '@/components/layout/HeroSection'
import { InlineError } from '@/components/layout/inline-error'
import { LoadingRows } from '@/components/layout/loading-rows'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useBilling } from '@/lib/api/hooks/useBilling'
import { currentPlan, PLAN_ROWS } from '@/lib/utils/plans'

/**
 * BILL-02 (design system §29.4): Free and Pro compared, in the order of the
 * owner's Pro split. The account's plan is the server's answer; nothing here
 * offers a purchase, because none exists yet.
 */
export default function PlansPage() {
	const t = useTranslations('billing.plans')
	const locale = useLocale() as Locale
	const billing = useBilling()
	const errorText = useApiErrorMessage()

	const plan = billing.data ? currentPlan(billing.data) : null
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

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 sm:gap-8">
			<HeroSection title={<>{t('title')}</>} subtitle={<>{t('subtitle')}</>} />

			<section aria-labelledby="plans-current" className="space-y-2">
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
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{t('notForSale')}
				</p>
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
				<p className="type-body-sm max-w-[68ch] text-ink-3">{t('downgrade')}</p>
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
