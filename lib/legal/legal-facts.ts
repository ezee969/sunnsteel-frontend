import {
	PRO_PRICE,
	REVOCATION_WINDOW_DAYS,
	SUBSCRIPTION_GRACE_DAYS,
	SUBSCRIPTION_TRIAL_DAYS,
} from '@sunsteel/contracts'

/**
 * BILL-07: who sells Sunnsteel Pro, as Argentina's consumer law asks an
 * online seller to say, and the numbers the legal texts quote. The owner
 * gave these on 2026-11-19; they are public on purpose, because the terms,
 * privacy and refund pages must show them.
 */
export const SELLER = {
	name: 'Ezequiel Matías Olivero',
	cuit: '20394223108',
	address: 'Estrada 939, Río Cuarto (5800), Córdoba, Argentina',
	email: 'sunnsteel.support@gmail.com',
} as const

/** The youngest a member may be; under 18 needs a guardian to buy Pro. */
export const MINIMUM_AGE = 16

/** When the texts last changed. */
export const LEGAL_UPDATED = '2026-11-19'

/** `20394223108` as ARCA writes it: `20-39422310-8`. */
export function formatCuit(cuit: string): string {
	const digits = cuit.replace(/\D/g, '')
	return digits.length === 11
		? `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
		: cuit
}

/** Everything a legal text quotes, so no number is typed twice. */
export interface LegalFacts {
	name: string
	cuit: string
	address: string
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
		name: SELLER.name,
		cuit: formatCuit(SELLER.cuit),
		address: SELLER.address,
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
