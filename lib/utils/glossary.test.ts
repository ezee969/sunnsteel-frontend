import { describe, expect, it } from 'vitest'

import { LOCALES } from '@/i18n/config'
import { translatorFor } from '@/i18n/translator'

import { GLOSSARY_TERMS } from './glossary'

describe('glossary (UX-18)', () => {
	for (const locale of LOCALES) {
		const t = translatorFor(locale, 'core.glossary')

		it.each(GLOSSARY_TERMS)(`${locale}: %s has a term and a definition`, id => {
			expect(t(`${id}.term`).length).toBeGreaterThan(0)
			expect(t(`${id}.definition`).length).toBeGreaterThan(40)
		})
	}

	it('never promises a benefit or gives advice', () => {
		// The product states what a thing is, never what it does for you
		// (PRODUCT_VISION, "Evidence Before Claims"), so no definition may
		// say a deload or a scheme is good for recovery, gains or anything else.
		for (const locale of LOCALES) {
			const t = translatorFor(locale, 'core.glossary')
			for (const id of GLOSSARY_TERMS) {
				expect(t(`${id}.definition`)).not.toMatch(
					/recover|gains|should|helps|better|recuper|deber|ayuda|mejor/i,
				)
			}
		}
	})
})
