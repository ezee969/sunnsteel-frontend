import { format } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { dateFnsLocale } from './date-locale'

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
})
