import {
	PRO_PRICE,
	REVOCATION_WINDOW_DAYS,
	SUBSCRIPTION_GRACE_DAYS,
	SUBSCRIPTION_TRIAL_DAYS,
} from '@sunsteel/contracts'

/**
 * BILL-07: how to reach whoever sells Sunnsteel Pro, and the numbers the
 * legal texts quote. Until 2026-11-21 this also held the seller's name, CUIT
 * and address, which the texts printed; the owner removed them from the
 * public pages that day, knowingly, while real charges run (revision 325 of
 * the roadmap).
 */
export const SELLER = {
	email: 'sunnsteel.support@gmail.com',
} as const

/** The youngest a member may be; under 18 needs a guardian to buy Pro. */
export const MINIMUM_AGE = 16

/** When the texts last changed. */
export const LEGAL_UPDATED = '2026-11-21'

/** Everything a legal text quotes, so no number is typed twice. */
export interface LegalFacts {
	email: string
	minimumAge: number
	price: string
	trialDays: number
	graceDays: number
	revocationDays: number
}

export function legalFacts(
	formatPrice: (amount: number) => string,
): LegalFacts {
	return {
		email: SELLER.email,
		minimumAge: MINIMUM_AGE,
		price: formatPrice(PRO_PRICE.amount),
		trialDays: SUBSCRIPTION_TRIAL_DAYS,
		graceDays: SUBSCRIPTION_GRACE_DAYS,
		revocationDays: REVOCATION_WINDOW_DAYS,
	}
}

/** A legal text: sections of paragraphs and lists, links as `[text](/path)`. */
export interface LegalDocument {
	title: string
	sections: { heading: string; blocks: LegalBlock[] }[]
}

export type LegalBlock = string | { list: string[] }

export const LEGAL_DOCUMENT_IDS = ['terms', 'privacy', 'refunds'] as const
export type LegalDocumentId = (typeof LEGAL_DOCUMENT_IDS)[number]

/** Where each text lives. Spanish names, like the consumer-law buttons. */
export const LEGAL_PATHS: Record<LegalDocumentId, string> = {
	terms: '/terminos',
	privacy: '/privacidad',
	refunds: '/reembolsos',
}
