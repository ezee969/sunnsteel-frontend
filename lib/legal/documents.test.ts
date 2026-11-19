import {
	PRO_PRICE,
	REVOCATION_WINDOW_DAYS,
	SUBSCRIPTION_GRACE_DAYS,
	SUBSCRIPTION_TRIAL_DAYS,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { CONSUMER_REQUEST_PATHS } from '@/lib/utils/consumer-requests'

import { inlineSegments, legalDocument, legalFactsFor } from './documents'
import {
	formatCuit,
	LEGAL_DOCUMENT_IDS,
	LEGAL_PATHS,
	type LegalDocument,
	MINIMUM_AGE,
	SELLER,
} from './legal-facts'

const LOCALES = ['es', 'en'] as const

function allText(doc: LegalDocument): string {
	return [
		doc.title,
		...doc.sections.flatMap(section => [
			section.heading,
			...section.blocks.flatMap(block =>
				typeof block === 'string' ? [block] : block.list,
			),
		]),
	].join('\n')
}

describe('the seller (BILL-07)', () => {
	it('writes the CUIT as ARCA does', () => {
		expect(formatCuit(SELLER.cuit)).toBe('20-39422310-8')
		expect(formatCuit('123')).toBe('123')
	})

	it('quotes the numbers the server enforces', () => {
		const facts = legalFactsFor('es')
		expect(facts.trialDays).toBe(SUBSCRIPTION_TRIAL_DAYS)
		expect(facts.graceDays).toBe(SUBSCRIPTION_GRACE_DAYS)
		expect(facts.revocationDays).toBe(REVOCATION_WINDOW_DAYS)
		expect(facts.minimumAge).toBe(MINIMUM_AGE)
		expect(facts.price.replace(/\D/g, '')).toBe(String(PRO_PRICE.amount))
	})
})

describe('the legal texts (BILL-07)', () => {
	it.each(LEGAL_DOCUMENT_IDS)(
		'%s names the seller in both languages and leaves nothing to fill in',
		id => {
			for (const locale of LOCALES) {
				const text = allText(legalDocument(id, locale))
				expect(text).toContain(SELLER.email)
				expect(text).not.toMatch(/undefined|NaN|\{\{|\}\}|\$\{/)
			}
			expect(allText(legalDocument('terms', 'es'))).toContain('20-39422310-8')
		},
	)

	it.each(LEGAL_DOCUMENT_IDS)('%s is translated section for section', id => {
		const es = legalDocument(id, 'es')
		const en = legalDocument(id, 'en')
		expect(en.sections.length).toBe(es.sections.length)
		es.sections.forEach((section, index) => {
			expect(en.sections[index].blocks.length).toBe(section.blocks.length)
		})
	})

	it('links only to pages that exist', () => {
		const known = new Set([
			...Object.values(LEGAL_PATHS),
			...Object.values(CONSUMER_REQUEST_PATHS),
		])
		for (const id of LEGAL_DOCUMENT_IDS) {
			for (const locale of LOCALES) {
				for (const segment of inlineSegments(
					allText(legalDocument(id, locale)),
				)) {
					if (segment.kind === 'link') expect(known).toContain(segment.href)
				}
			}
		}
	})

	it('states the ten days, the trial, the grace period and the price', () => {
		const terms = allText(legalDocument('terms', 'es'))
		expect(terms).toContain(`${REVOCATION_WINDOW_DAYS} días corridos`)
		expect(terms).toContain(`${SUBSCRIPTION_TRIAL_DAYS} días de prueba gratis`)
		expect(terms).toContain(`durante ${SUBSCRIPTION_GRACE_DAYS} días`)
		expect(terms).toContain(legalFactsFor('es').price)
		expect(allText(legalDocument('terms', 'en'))).toContain(
			legalFactsFor('en').price,
		)
	})
})

describe('inlineSegments', () => {
	it('splits text and links, keeping everything in order', () => {
		expect(
			inlineSegments('Lee la [Política](/privacidad) y [esto](/baja).'),
		).toEqual([
			{ kind: 'text', text: 'Lee la ' },
			{ kind: 'link', text: 'Política', href: '/privacidad' },
			{ kind: 'text', text: ' y ' },
			{ kind: 'link', text: 'esto', href: '/baja' },
			{ kind: 'text', text: '.' },
		])
	})

	it('leaves text without links whole and never links outside the app', () => {
		expect(inlineSegments('Sin enlaces')).toEqual([
			{ kind: 'text', text: 'Sin enlaces' },
		])
		expect(inlineSegments('[afuera](https://example.com)')).toEqual([
			{ kind: 'text', text: '[afuera](https://example.com)' },
		])
	})
})
