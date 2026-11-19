import { PRO_PRICE } from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { formatPlanPrice } from '@/lib/utils/checkout'

import { privacyEn, refundsEn, termsEn } from './content-en'
import { privacyEs, refundsEs, termsEs } from './content-es'
import {
	type LegalDocument,
	type LegalDocumentId,
	type LegalFacts,
	legalFacts,
} from './legal-facts'

const WRITERS: Record<
	Locale,
	Record<LegalDocumentId, (facts: LegalFacts) => LegalDocument>
> = {
	es: { terms: termsEs, privacy: privacyEs, refunds: refundsEs },
	en: { terms: termsEn, privacy: privacyEn, refunds: refundsEn },
}

/** The facts as a language writes them: the price in its own number format. */
export function legalFactsFor(locale: Locale): LegalFacts {
	return legalFacts(() => formatPlanPrice(PRO_PRICE, locale))
}

/**
 * BILL-07: a legal text in the app's language. Spanish governs, so another
 * language's page shows its translation and the Spanish beside it.
 */
export function legalDocument(
	id: LegalDocumentId,
	locale: Locale,
): LegalDocument {
	return WRITERS[locale][id](legalFactsFor(locale))
}

export type InlineSegment =
	{ kind: 'text'; text: string } | { kind: 'link'; text: string; href: string }

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g

/** `see the [Privacy policy](/privacidad)` as text and link segments. */
export function inlineSegments(text: string): InlineSegment[] {
	const segments: InlineSegment[] = []
	let last = 0
	for (const match of text.matchAll(LINK)) {
		const at = match.index ?? 0
		if (at > last) segments.push({ kind: 'text', text: text.slice(last, at) })
		segments.push({ kind: 'link', text: match[1], href: match[2] })
		last = at + match[0].length
	}
	if (last < text.length)
		segments.push({ kind: 'text', text: text.slice(last) })
	return segments
}
