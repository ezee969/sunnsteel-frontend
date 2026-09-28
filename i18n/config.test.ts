import { describe, expect, it } from 'vitest'

import { localeFromAcceptLanguage, resolveLocale } from './config'

describe('locale resolution (I18N-01)', () => {
	it('uses a supported cookie before anything else', () => {
		expect(
			resolveLocale({
				cookie: 'es',
				acceptLanguage: 'en',
				detectBrowser: true,
			}),
		).toBe('es')
	})

	it('ignores a cookie it does not support', () => {
		expect(resolveLocale({ cookie: 'fr', acceptLanguage: 'es' })).toBe('en')
		expect(
			resolveLocale({
				cookie: 'ES',
				acceptLanguage: 'es',
				detectBrowser: true,
			}),
		).toBe('es')
	})

	it('does not follow the browser until detection is turned on', () => {
		expect(resolveLocale({ acceptLanguage: 'es-AR,es;q=0.9' })).toBe('en')
		expect(
			resolveLocale({ acceptLanguage: 'es-AR,es;q=0.9', detectBrowser: true }),
		).toBe('es')
	})

	it('reads Accept-Language by weight and skips what it cannot speak', () => {
		expect(localeFromAcceptLanguage('fr-FR,fr;q=0.9,es;q=0.8,en;q=0.7')).toBe(
			'es',
		)
		expect(localeFromAcceptLanguage('en;q=0.5,es;q=0.9')).toBe('es')
		expect(localeFromAcceptLanguage('es;q=0,en')).toBe('en')
		expect(localeFromAcceptLanguage('de,fr')).toBeNull()
		expect(localeFromAcceptLanguage(null)).toBeNull()
	})
})
