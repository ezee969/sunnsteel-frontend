import type { BillingStatus, FeatureKey } from '@sunsteel/contracts'

import { checkoutOfferState } from './checkout'

/**
 * BILL-05: where this device keeps when the member put the dashboard's Pro
 * offer away. The device, not the account, by the owner's decision at claim:
 * another device may show it once more, and nothing reaches the server.
 */
export const PRO_OFFER_STORAGE_KEY = 'ss-pro-offer-put-away-at'

/** How long the offer stays away once put away (owner, 2026-11-19). */
export const PRO_OFFER_AWAY_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/** The stored moment, or null for none or anything that is not one. */
export function readPutAwayAt(raw: string | null): Date | null {
	if (!raw) return null
	const at = new Date(raw)
	return Number.isNaN(at.getTime()) ? null : at
}

/**
 * Whether the dashboard offers Pro: only to an account the server says can
 * buy it now -- on Free, with checkout available, so a Pro account (a
 * founding member, a subscriber in a trial) never sees it -- and not within
 * `PRO_OFFER_AWAY_DAYS` of putting it away. A moment later than now (the
 * clock was moved back) does not keep it away for longer than that.
 */
export function showsProOffer(
	status: BillingStatus,
	putAwayAt: Date | null,
	now: Date,
): boolean {
	const offer = checkoutOfferState(status)
	if (offer.kind !== 'buy' && offer.kind !== 'resume') return false
	if (!putAwayAt) return true
	const away = now.getTime() - putAwayAt.getTime()
	return away < 0 || away >= PRO_OFFER_AWAY_DAYS * DAY_MS
}

/**
 * What Pro adds, as outcomes rather than capabilities: the dashboard says
 * each in one line, `/plans` with its sentence. Each names the capabilities
 * it stands for, so it never claims one the server does not gate.
 */
export const PRO_OUTCOMES = [
	{
		key: 'plan',
		features: ['TRAINING_BLOCKS', 'PLANNED_DELOADS', 'EIGHT_WEEK_BLOCKS'],
	},
	{
		key: 'compare',
		features: ['TRAINING_COMPARISON', 'TRAINING_SIGNALS', 'GOAL_SUGGESTIONS'],
	},
	{
		key: 'history',
		features: [
			'STRENGTH_TRENDS_LONG_RANGES',
			'MUSCLE_HISTORY_LONG',
			'BODY_MEASUREMENTS',
		],
	},
	{ key: 'yours', features: ['DASHBOARD_CUSTOMIZATION', 'ROUTINE_DRAFTS'] },
] as const satisfies ReadonlyArray<{
	key: string
	features: ReadonlyArray<FeatureKey>
}>

export type ProOutcomeKey = (typeof PRO_OUTCOMES)[number]['key']
