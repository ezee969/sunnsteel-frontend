'use client'

import { Crown } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useBilling } from '@/lib/api/hooks/useBilling'
import { currentPlan } from '@/lib/utils/plans'

/**
 * BILL-02: the account's plan as the server answered it, and the way to the
 * comparison. Nothing here buys anything; Pro cannot be bought yet.
 */
export function PlanCard() {
	const t = useTranslations('billing.settingsPlan')
	const locale = useLocale() as Locale
	const billing = useBilling()
	const plan = billing.data ? currentPlan(billing.data) : null
	const label = !plan
		? null
		: plan.kind === 'FREE'
			? t('free')
			: plan.until
				? t('proUntil', {
						date: dateFormatter(locale, { dateStyle: 'long' }).format(
							new Date(plan.until),
						),
					})
				: t('proNoEnd')

	return (
		<Card id="plan" className="scroll-mt-24">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Crown className="h-5 w-5 text-ink-2" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				{label ? <CardDescription>{label}</CardDescription> : null}
			</CardHeader>
			<CardContent>
				<Button asChild variant="outline" size="sm">
					<Link href="/plans">{t('comparePlans')}</Link>
				</Button>
			</CardContent>
		</Card>
	)
}
