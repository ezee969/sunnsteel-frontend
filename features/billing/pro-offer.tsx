'use client'

import { Crown } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/config'
import { useBilling } from '@/lib/api/hooks/useBilling'
import { formatPlanPrice } from '@/lib/utils/checkout'
import {
	PRO_OFFER_STORAGE_KEY,
	PRO_OUTCOMES,
	readPutAwayAt,
	showsProOffer,
} from '@/lib/utils/pro-offer'

const CHANGE_EVENT = 'ss-pro-offer-change'

/** Put away in this tab when storage refuses it. */
let unstored: string | null = null

/** This device's "put away" moment as stored; storage that throws reads as none. */
function readStored(): string | null {
	try {
		return window.localStorage.getItem(PRO_OFFER_STORAGE_KEY) ?? unstored
	} catch {
		return unstored
	}
}

function subscribe(onChange: () => void) {
	window.addEventListener('storage', onChange)
	window.addEventListener(CHANGE_EVENT, onChange)
	return () => {
		window.removeEventListener('storage', onChange)
		window.removeEventListener(CHANGE_EVENT, onChange)
	}
}

function putAway() {
	const now = new Date().toISOString()
	try {
		window.localStorage.setItem(PRO_OFFER_STORAGE_KEY, now)
	} catch {
		// Not remembered past this tab, but it still goes away.
		unstored = now
	}
	window.dispatchEvent(new Event(CHANGE_EVENT))
}

/**
 * BILL-05 (design system §30.1): Pro offered on the dashboard, under Today's
 * Workouts and never above it, to an account on Free that can buy it. It is a
 * ruled section like Getting Started: what Pro adds in three lines, the price
 * with the trial when the account still has one, and an outline link to
 * `/plans` -- the dashboard's one filled action stays Today's Workouts. Not
 * now puts it away on this device for 30 days (the owner's decisions).
 *
 * The server snapshot is "not read yet", so the static page never renders a
 * card the device would then remove.
 */
export function ProOffer() {
	const t = useTranslations('billing.offer')
	const locale = useLocale() as Locale
	const billing = useBilling()
	const stored = useSyncExternalStore<string | null | undefined>(
		subscribe,
		readStored,
		() => undefined,
	)

	if (stored === undefined || !billing.data) return null
	if (!showsProOffer(billing.data, readPutAwayAt(stored), new Date())) {
		return null
	}

	const price = formatPlanPrice(billing.data.checkout.price, locale)
	const trialDays = billing.data.checkout.trialDays

	return (
		<section aria-labelledby="dashboard-pro-offer-heading">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-x-6 gap-y-1 pb-2">
				<h2
					id="dashboard-pro-offer-heading"
					className="type-section flex items-center gap-2 text-foreground"
				>
					<Crown className="h-4 w-4 text-ink-3" aria-hidden />
					{t('title')}
				</h2>
				<Button type="button" variant="ghost" size="sm" onClick={putAway}>
					{t('notNow')}
				</Button>
			</div>
			<div className="space-y-3 pt-3">
				<p className="type-body max-w-[68ch] text-foreground">{t('lead')}</p>
				<ul className="type-body-sm max-w-[68ch] list-disc space-y-1 pl-5 text-ink-2 marker:text-ink-3">
					{PRO_OUTCOMES.slice(0, 3).map(outcome => (
						<li key={outcome.key}>{t(`outcomes.${outcome.key}.short`)}</li>
					))}
				</ul>
				<p className="type-body-sm text-ink-3">
					{trialDays
						? t('priceTrial', { days: trialDays, price })
						: t('price', { price })}
				</p>
				<Button asChild variant="outline" size="sm">
					<Link href="/plans">{t('see')}</Link>
				</Button>
			</div>
		</section>
	)
}
