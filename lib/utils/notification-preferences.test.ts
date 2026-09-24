import type { NotificationPreferencesResponse } from '@sunsteel/contracts'
import { NOTIFICATION_CATEGORIES } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	CATEGORY_DESCRIPTIONS,
	CATEGORY_LABELS,
	describeQuietHours,
	describeReminder,
	describeTimeZone,
	formatMinuteOfDay,
	parseMinuteOfDay,
	preferencesNotice,
} from './notification-preferences'

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
			describeQuietHours({ startMinute: 22 * 60, endMinute: 7 * 60 }),
		).toBe('Nothing is delivered between 22:00 and 07:00 the next morning.')
	})

	it('leaves a same-day window unqualified', () => {
		expect(
			describeQuietHours({ startMinute: 9 * 60, endMinute: 17 * 60 }),
		).toBe('Nothing is delivered between 09:00 and 17:00.')
	})

	it('does not claim an empty window silences anything', () => {
		expect(describeQuietHours({ startMinute: 600, endMinute: 600 })).toBe(
			'The window is empty, so nothing is silenced.',
		)
	})

	it('says notifications can arrive at any time when there is no window', () => {
		expect(describeQuietHours(null)).toMatch(/any time/)
	})
})

describe('reminder copy', () => {
	it('states both halves of the rule: the time, and only on training days', () => {
		const copy = describeReminder(18 * 60 + 30)
		expect(copy).toContain('18:30')
		expect(copy).toMatch(/planned to train/)
		expect(copy).toMatch(/not on the days you are not/)
	})

	it('never implies a countdown to a session', () => {
		expect(describeReminder(1110)).not.toMatch(
			/before|countdown|minutes ahead/i,
		)
	})

	it('says nothing is sent when it is off', () => {
		expect(describeReminder(null)).toBe('No reminder is sent.')
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
		expect(describeTimeZone('Europe/Berlin')).toContain('Europe/Berlin')
	})

	it('explains why reminders stay off without one', () => {
		expect(describeTimeZone(null)).toMatch(/stay off/)
	})
})

describe('the streak-at-risk category (NOTIF-06)', () => {
	it('says it replaces the reminder rather than adding a push', () => {
		expect(CATEGORY_DESCRIPTIONS.STREAK_AT_RISK).toMatch(/replaces/)
		expect(CATEGORY_DESCRIPTIONS.STREAK_AT_RISK).toMatch(
			/rather than adding a second/,
		)
	})

	it('never promises to tell anyone to train', () => {
		expect(CATEGORY_DESCRIPTIONS.STREAK_AT_RISK).toMatch(/states the dates/)
	})

	it('is switchable like the others, so every category has copy', () => {
		for (const category of NOTIFICATION_CATEGORIES) {
			expect(CATEGORY_LABELS[category]).toBeTruthy()
			expect(CATEGORY_DESCRIPTIONS[category]).toBeTruthy()
		}
	})
})

describe('partner activity alerts (NOTIF-07)', () => {
	it('states the selected facts and both privacy boundaries', () => {
		expect(CATEGORY_DESCRIPTIONS.TRAINING_PARTNER_SESSION).toMatch(
			/active training partner/,
		)
		expect(CATEGORY_DESCRIPTIONS.TRAINING_PARTNER_SESSION).toMatch(
			/currently share/,
		)
		expect(CATEGORY_DESCRIPTIONS.TRAINING_PARTNER_SESSION).toMatch(
			/do not create extra alerts/,
		)
		expect(CATEGORY_DESCRIPTIONS.TRAINING_PARTNER_ACHIEVEMENT).toMatch(
			/Historical achievements are never replayed/,
		)
	})
})
