import type {
	NotificationCategory,
	NotificationPreferencesResponse,
	QuietHours,
} from '@sunsteel/contracts'

import type { MessageKey, Translator } from '@/i18n/translator'

type Namespace = 'settings.notificationPreferences'
type Key = MessageKey<Namespace>

/**
 * NOTIF-05 copy and the conversions between a `<input type="time">` value and
 * the minutes-from-midnight the contract stores. Pure, because the wrapping
 * window and the "this is on but cannot reach you" states are exactly the
 * things that are easy to word wrongly.
 */

export const CATEGORY_LABEL_KEYS = {
	REST_ALERT: 'categoryLabel.REST_ALERT',
	TRAINING_REMINDER: 'categoryLabel.TRAINING_REMINDER',
	STREAK_AT_RISK: 'categoryLabel.STREAK_AT_RISK',
	TRAINING_PARTNER_SESSION: 'categoryLabel.TRAINING_PARTNER_SESSION',
	TRAINING_PARTNER_ACHIEVEMENT: 'categoryLabel.TRAINING_PARTNER_ACHIEVEMENT',
} as const satisfies Record<NotificationCategory, Key>

export const CATEGORY_DESCRIPTION_KEYS = {
	REST_ALERT: 'categoryDescription.REST_ALERT',
	TRAINING_REMINDER: 'categoryDescription.TRAINING_REMINDER',
	STREAK_AT_RISK: 'categoryDescription.STREAK_AT_RISK',
	TRAINING_PARTNER_SESSION: 'categoryDescription.TRAINING_PARTNER_SESSION',
	TRAINING_PARTNER_ACHIEVEMENT:
		'categoryDescription.TRAINING_PARTNER_ACHIEVEMENT',
} as const satisfies Record<NotificationCategory, Key>

/** `1110` → `18:30`. Zero-padded so it round-trips through a time input. */
export function formatMinuteOfDay(minuteOfDay: number): string {
	const hours = Math.floor(minuteOfDay / 60)
	const minutes = minuteOfDay % 60
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** `18:30` → `1110`, or null when the field is empty or not a real time. */
export function parseMinuteOfDay(value: string): number | null {
	const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
	if (!match) return null
	const hours = Number(match[1])
	const minutes = Number(match[2])
	if (hours > 23 || minutes > 59) return null
	return hours * 60 + minutes
}

/**
 * States the window in the owner's own terms, including that it runs overnight
 * — a window read as "22:00 to 07:00" on one day is the single most likely
 * thing to be misunderstood.
 */
export function describeQuietHours(
	t: Translator<Namespace>,
	quietHours: QuietHours | null,
): string {
	if (!quietHours) return t('quietHoursAny')
	if (quietHours.startMinute === quietHours.endMinute) {
		return t('quietHoursEmpty')
	}
	const start = formatMinuteOfDay(quietHours.startMinute)
	const end = formatMinuteOfDay(quietHours.endMinute)
	const overnight = quietHours.startMinute > quietHours.endMinute
	return overnight
		? t('quietHoursOvernight', { start, end })
		: t('quietHoursSameDay', { start, end })
}

export function describeReminder(
	t: Translator<Namespace>,
	minuteOfDay: number | null,
): string {
	return minuteOfDay === null
		? t('reminderOff')
		: t('reminderOn', { time: formatMinuteOfDay(minuteOfDay) })
}

export type PreferencesNotice =
	'PUSH_UNAVAILABLE' | 'NO_DEVICE' | 'ALL_CATEGORIES_OFF' | null

/**
 * The one thing worth saying above the controls. A switch left on while
 * nothing can deliver it reads as working, which is the failure this prevents.
 */
export function preferencesNotice(
	data: NotificationPreferencesResponse | undefined,
): PreferencesNotice {
	if (!data) return null
	if (!data.pushAvailable) return 'PUSH_UNAVAILABLE'
	if (!data.hasSubscribedDevice) return 'NO_DEVICE'
	const { categories } = data.preferences
	return Object.values(categories).every(enabled => !enabled)
		? 'ALL_CATEGORIES_OFF'
		: null
}

export const PREFERENCES_NOTICE_KEYS = {
	PUSH_UNAVAILABLE: 'notice.PUSH_UNAVAILABLE',
	NO_DEVICE: 'notice.NO_DEVICE',
	ALL_CATEGORIES_OFF: 'notice.ALL_CATEGORIES_OFF',
} as const satisfies Record<Exclude<PreferencesNotice, null>, Key>

/**
 * The reminder needs a zone to know when the owner's day is. The device knows
 * it; the server only learns it when a device registers one.
 */
export function describeTimeZone(
	t: Translator<Namespace>,
	timeZone: string | null,
): string {
	return timeZone ? t('timeZoneKnown', { timeZone }) : t('timeZoneUnknown')
}
