import { format } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { dateFnsLocale, dateFormatter, intlLocale } from './date-locale'

describe('date-fns locale (I18N-01)', () => {
	const monday = new Date(2026, 8, 28)

	it('prints weekdays and months in the chosen language', () => {
		expect(format(monday, 'EEEE d MMMM', { locale: dateFnsLocale('en') })).toBe(
			'Monday 28 September',
		)
		expect(format(monday, 'EEEE d MMMM', { locale: dateFnsLocale('es') })).toBe(
			'lunes 28 septiembre',
		)
	})

	it('formats with Intl per language and keeps English as en-US', () => {
		expect(intlLocale('en')).toBe('en-US')
		const options = { month: 'short', day: 'numeric' } as const
		expect(dateFormatter('en', options).format(monday)).toBe('Sep 28')
		expect(dateFormatter('es', options).format(monday)).toBe('28 sept')
		expect(dateFormatter('es', options)).toBe(dateFormatter('es', options))
		expect((1234.5).toLocaleString(intlLocale('es'))).toBe('1234,5')
	})
})
