import type { NotificationPreferencesResponse } from '@sunsteel/contracts'
import { NOTIFICATION_CATEGORIES } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	CATEGORY_DESCRIPTION_KEYS,
	CATEGORY_LABEL_KEYS,
	describeQuietHours,
	describeReminder,
	describeTimeZone,
	formatMinuteOfDay,
	parseMinuteOfDay,
	preferencesNotice,
} from './notification-preferences'

const t = translatorFor('en', 'settings.notificationPreferences')
const tEs = translatorFor('es', 'settings.notificationPreferences')

const response = (
	overrides: Partial<NotificationPreferencesResponse> = {},
	preferences: Partial<NotificationPreferencesResponse['preferences']> = {},
): NotificationPreferencesResponse => ({
	preferences: {
		categories: {
			REST_ALERT: true,
			TRAINING_REMINDER: true,
			STREAK_AT_RISK: true,
			TRAINING_PARTNER_SESSION: false,
			TRAINING_PARTNER_ACHIEVEMENT: false,
			MESSAGE: true,
		},
		quietHours: null,
		reminder: { minuteOfDay: null },
		timeZone: 'Europe/Berlin',
		...preferences,
	},
	hasSubscribedDevice: true,
	pushAvailable: true,
	...overrides,
})

describe('minute-of-day conversion', () => {
	it('round-trips through the value a time input uses', () => {
		for (const minute of [0, 1, 59, 60, 420, 1110, 1439]) {
			expect(parseMinuteOfDay(formatMinuteOfDay(minute))).toBe(minute)
		}
	})

	it('pads both halves so the input accepts it', () => {
		expect(formatMinuteOfDay(0)).toBe('00:00')
		expect(formatMinuteOfDay(9 * 60 + 5)).toBe('09:05')
		expect(formatMinuteOfDay(1439)).toBe('23:59')
	})

	it('refuses anything that is not a real time', () => {
		expect(parseMinuteOfDay('')).toBeNull()
		expect(parseMinuteOfDay('24:00')).toBeNull()
		expect(parseMinuteOfDay('12:60')).toBeNull()
		expect(parseMinuteOfDay('half past six')).toBeNull()
	})
})

describe('quiet-hours copy', () => {
	it('says plainly that an overnight window runs into the next morning', () => {
		expect(
			describeQuietHours(t, { startMinute: 22 * 60, endMinute: 7 * 60 }),
		).toBe('Nothing is delivered between 22:00 and 07:00 the next morning.')
	})

	it('leaves a same-day window unqualified', () => {
		expect(
			describeQuietHours(t, { startMinute: 9 * 60, endMinute: 17 * 60 }),
		).toBe('Nothing is delivered between 09:00 and 17:00.')
	})

	it('does not claim an empty window silences anything', () => {
		expect(describeQuietHours(t, { startMinute: 600, endMinute: 600 })).toBe(
			'The window is empty, so nothing is silenced.',
		)
	})

	it('says notifications can arrive at any time when there is no window', () => {
		expect(describeQuietHours(t, null)).toMatch(/any time/)
	})
})

describe('reminder copy', () => {
	it('states both halves of the rule: the time, and only on training days', () => {
		const copy = describeReminder(t, 18 * 60 + 30)
		expect(copy).toContain('18:30')
		expect(copy).toMatch(/planned to train/)
		expect(copy).toMatch(/not on the days you are not/)
	})

	it('never implies a countdown to a session', () => {
		expect(describeReminder(t, 1110)).not.toMatch(
			/before|countdown|minutes ahead/i,
		)
	})

	it('says nothing is sent when it is off', () => {
		expect(describeReminder(t, null)).toBe('No reminder is sent.')
	})
})

describe('the notice above the controls', () => {
	it('stays quiet when everything can actually be delivered', () => {
		expect(preferencesNotice(response())).toBeNull()
	})

	it('puts an unusable server ahead of every other notice', () => {
		expect(
			preferencesNotice(
				response({ pushAvailable: false, hasSubscribedDevice: false }),
			),
		).toBe('PUSH_UNAVAILABLE')
	})

	it('says so when no device can receive the choices', () => {
		expect(preferencesNotice(response({ hasSubscribedDevice: false }))).toBe(
			'NO_DEVICE',
		)
	})

	it('warns when every category is off, which reads as broken otherwise', () => {
		expect(
			preferencesNotice(
				response(
					{},
					{
						categories: {
							REST_ALERT: false,
							TRAINING_REMINDER: false,
							STREAK_AT_RISK: false,
							TRAINING_PARTNER_SESSION: false,
							TRAINING_PARTNER_ACHIEVEMENT: false,
							MESSAGE: false,
						},
					},
				),
			),
		).toBe('ALL_CATEGORIES_OFF')
	})

	it('stays quiet while one category is still on', () => {
		expect(
			preferencesNotice(
				response(
					{},
					{
						categories: {
							REST_ALERT: false,
							TRAINING_REMINDER: true,
							STREAK_AT_RISK: false,
							TRAINING_PARTNER_SESSION: false,
							TRAINING_PARTNER_ACHIEVEMENT: false,
							MESSAGE: false,
						},
					},
				),
			),
		).toBeNull()
	})

	it('has nothing to say before the preferences arrive', () => {
		expect(preferencesNotice(undefined)).toBeNull()
	})
})

describe('time-zone copy', () => {
	it('names the zone the times are read in', () => {
		expect(describeTimeZone(t, 'Europe/Berlin')).toContain('Europe/Berlin')
	})

	it('explains why reminders stay off without one', () => {
		expect(describeTimeZone(t, null)).toMatch(/stay off/)
	})
})

describe('the streak-at-risk category (NOTIF-06)', () => {
	it('says it replaces the reminder rather than adding a push', () => {
		expect(t(CATEGORY_DESCRIPTION_KEYS.STREAK_AT_RISK)).toMatch(/replaces/)
		expect(t(CATEGORY_DESCRIPTION_KEYS.STREAK_AT_RISK)).toMatch(
			/rather than adding a second/,
		)
	})

	it('never promises to tell anyone to train', () => {
		expect(t(CATEGORY_DESCRIPTION_KEYS.STREAK_AT_RISK)).toMatch(
			/states the dates/,
		)
	})

	it('is switchable like the others, so every category has copy', () => {
		for (const category of NOTIFICATION_CATEGORIES) {
			expect(t(CATEGORY_LABEL_KEYS[category])).toBeTruthy()
			expect(t(CATEGORY_DESCRIPTION_KEYS[category])).toBeTruthy()
		}
	})
})

describe('partner activity alerts (NOTIF-07)', () => {
	it('states the selected facts and both privacy boundaries', () => {
		expect(t(CATEGORY_DESCRIPTION_KEYS.TRAINING_PARTNER_SESSION)).toMatch(
			/active training partner/,
		)
		expect(t(CATEGORY_DESCRIPTION_KEYS.TRAINING_PARTNER_SESSION)).toMatch(
			/currently share/,
		)
		expect(t(CATEGORY_DESCRIPTION_KEYS.TRAINING_PARTNER_SESSION)).toMatch(
			/do not create extra alerts/,
		)
		expect(t(CATEGORY_DESCRIPTION_KEYS.TRAINING_PARTNER_ACHIEVEMENT)).toMatch(
			/Historical achievements are never replayed/,
		)
	})
})

describe('message notifications (MSG-08)', () => {
	it('says when one arrives, that it names only the sender, and that requests never notify', () => {
		const copy = t(CATEGORY_DESCRIPTION_KEYS.MESSAGE)
		expect(t(CATEGORY_LABEL_KEYS.MESSAGE)).toBe('New messages')
		expect(copy).toMatch(/half a minute/)
		expect(copy).toMatch(/One notification per conversation until you read it/)
		expect(copy).toMatch(/never what they said/)
		expect(copy).toMatch(/requests never notify/)
	})

	it('says the same in Spanish', () => {
		const copy = tEs(CATEGORY_DESCRIPTION_KEYS.MESSAGE)
		expect(tEs(CATEGORY_LABEL_KEYS.MESSAGE)).toBe('Mensajes nuevos')
		expect(copy).toMatch(/medio minuto/)
		expect(copy).toMatch(/Una notificación por conversación hasta que la leas/)
		expect(copy).toMatch(/nunca lo que dijo/)
		expect(copy).toMatch(/solicitudes de mensaje nunca notifican/)
	})
})

describe('the same rules in Spanish', () => {
	it('says plainly that an overnight window runs into the next morning', () => {
		expect(
			describeQuietHours(tEs, { startMinute: 22 * 60, endMinute: 7 * 60 }),
		).toBe('No se entrega nada entre 22:00 y 07:00 de la mañana siguiente.')
		expect(
			describeQuietHours(tEs, { startMinute: 9 * 60, endMinute: 17 * 60 }),
		).toBe('No se entrega nada entre 09:00 y 17:00.')
		expect(describeQuietHours(tEs, { startMinute: 600, endMinute: 600 })).toBe(
			'La ventana está vacía, así que no se silencia nada.',
		)
	})

	it('states both halves of the reminder rule and never a countdown', () => {
		const copy = describeReminder(tEs, 18 * 60 + 30)
		expect(copy).toContain('18:30')
		expect(copy).toMatch(/tienes planificado entrenar/)
		expect(copy).toMatch(/no los días en que no/)
		expect(copy).not.toMatch(/antes|cuenta regresiva|minutos de antelación/i)
		expect(describeReminder(tEs, null)).toBe('No se envía ningún recordatorio.')
	})

	it('explains why reminders stay off without a time zone', () => {
		expect(describeTimeZone(tEs, 'Europe/Berlin')).toContain('Europe/Berlin')
		expect(describeTimeZone(tEs, null)).toMatch(/seguirán desactivados/)
	})

	it('keeps the streak copy honest and gives every category copy', () => {
		const streak = tEs(CATEGORY_DESCRIPTION_KEYS.STREAK_AT_RISK)
		expect(streak).toMatch(/Reemplaza/)
		expect(streak).toMatch(/en lugar de agregar una segunda/)
		expect(streak).toMatch(/indica las fechas/)
		expect(tEs(CATEGORY_DESCRIPTION_KEYS.TRAINING_PARTNER_ACHIEVEMENT)).toMatch(
			/nunca se reenvían/,
		)
		for (const category of NOTIFICATION_CATEGORIES) {
			expect(tEs(CATEGORY_LABEL_KEYS[category])).toBeTruthy()
		}
	})
})
