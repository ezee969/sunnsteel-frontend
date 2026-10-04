import { describe, expect, it } from 'vitest'

import { daysOfWeekInOrder } from '@/features/routines/wizard/constants/training-days'
import { translatorFor } from '@/i18n/translator'

import {
	knownTimeZones,
	orderTimeZones,
	timeZoneLabel,
	zonesDiffer,
} from './regional'
import {
	buildScheduleMonth,
	scheduleMonthRange,
	startOfMonth,
} from './schedule-month'
import {
	buildScheduleWeek,
	describeWeek,
	localDateKey,
	startOfWeek,
} from './schedule-week'

const tWeek = translatorFor('en', 'planning.scheduleWeek')

// Wednesday 16 Sep 2026, local time.
const NOW = new Date(2026, 8, 16, 12, 0)
const SUNDAY = new Date(2026, 8, 20, 9, 0)

describe('the week start (PREF-04)', () => {
	it('starts a week on Monday by default and on Sunday when chosen', () => {
		expect(localDateKey(startOfWeek(NOW))).toBe('2026-09-14')
		expect(localDateKey(startOfWeek(NOW, 1))).toBe('2026-09-14')
		expect(localDateKey(startOfWeek(NOW, 0))).toBe('2026-09-13')
		// A Sunday ends a Monday week and starts a Sunday one.
		expect(localDateKey(startOfWeek(SUNDAY, 1))).toBe('2026-09-14')
		expect(localDateKey(startOfWeek(SUNDAY, 0))).toBe('2026-09-20')
	})

	it('names the current Sunday week as this week', () => {
		expect(describeWeek('2026-09-13', NOW, 'en', tWeek, 0)).toBe('This week')
		expect(describeWeek('2026-09-20', NOW, 'en', tWeek, 0)).toBe('Next week')
		expect(describeWeek('2026-09-06', NOW, 'en', tWeek, 0)).toBe('Last week')
	})

	it('builds a Sunday week from its Sunday', () => {
		const week = buildScheduleWeek({
			weekStart: startOfWeek(NOW, 0),
			now: NOW,
			routines: [],
			sessions: [],
		})
		expect(week.days.map(day => day.date)).toEqual([
			'2026-09-13',
			'2026-09-14',
			'2026-09-15',
			'2026-09-16',
			'2026-09-17',
			'2026-09-18',
			'2026-09-19',
		])
	})

	it('lays a month out in Sunday rows and reads the grid it shows', () => {
		const september = startOfMonth(NOW)
		const month = buildScheduleMonth({
			monthStart: september,
			now: NOW,
			routines: [],
			sessions: [],
			weekStartsOn: 0,
		})
		// 1 Sep 2026 is a Tuesday and 30 Sep a Wednesday: Aug 30 – Oct 3.
		expect(month.weeks).toHaveLength(5)
		expect(month.weeks[0][0].date).toBe('2026-08-30')
		expect(month.weeks[4][6].date).toBe('2026-10-03')
		const { from, to } = scheduleMonthRange(september, 0)
		expect(new Date(from).getDate()).toBe(30)
		expect(new Date(to).getMonth()).toBe(9)
		expect(new Date(to).getDate()).toBe(5)
	})

	it("orders the builder's weekdays from the week's first day, keeping their numbers", () => {
		expect(daysOfWeekInOrder(1).map(day => day.id)).toEqual([
			1, 2, 3, 4, 5, 6, 0,
		])
		expect(daysOfWeekInOrder(0).map(day => day.id)).toEqual([
			0, 1, 2, 3, 4, 5, 6,
		])
	})
})

describe('the time zone choices (PREF-04)', () => {
	it("lists this device's zone first, then the account's, then the rest", () => {
		const zones = ['UTC', 'Europe/Madrid', 'Asia/Tokyo', 'America/New_York']
		expect(orderTimeZones(zones, 'Europe/Madrid', 'Asia/Tokyo')).toEqual([
			'Asia/Tokyo',
			'Europe/Madrid',
			'America/New_York',
			'UTC',
		])
		expect(orderTimeZones(zones, 'UTC', 'UTC')).toEqual([
			'UTC',
			'America/New_York',
			'Asia/Tokyo',
			'Europe/Madrid',
		])
		expect(orderTimeZones(zones, null, null)[0]).toBe('America/New_York')
	})

	it('keeps a zone in hand even when the runtime does not list it', () => {
		const zones = knownTimeZones('Etc/Unlisted', null)
		expect(zones).toContain('Etc/Unlisted')
		expect(zones.filter(zone => zone === 'Etc/Unlisted')).toHaveLength(1)
	})

	it('names a zone by its place and its offset at the time given', () => {
		const july = new Date('2026-07-01T12:00:00Z')
		expect(timeZoneLabel('Europe/Madrid', 'en', july)).toBe(
			'Europe / Madrid (GMT+2)',
		)
		expect(timeZoneLabel('America/Argentina/Buenos_Aires', 'en', july)).toBe(
			'America / Argentina / Buenos Aires (GMT-3)',
		)
		expect(timeZoneLabel('Not/AZone', 'en', july)).toBe('Not / AZone')
	})

	it('treats two names of one zone as the same clock', () => {
		expect(zonesDiffer('Europe/Madrid', 'Europe/Madrid')).toBe(false)
		expect(zonesDiffer('US/Eastern', 'America/New_York')).toBe(false)
		expect(zonesDiffer('Europe/Madrid', 'America/New_York')).toBe(true)
		expect(zonesDiffer(null, 'Europe/Madrid')).toBe(false)
		expect(zonesDiffer('Europe/Madrid', null)).toBe(false)
	})
})
