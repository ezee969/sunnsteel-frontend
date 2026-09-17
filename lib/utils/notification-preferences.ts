import type {
	NotificationCategory,
	NotificationPreferencesResponse,
	QuietHours,
} from '@sunsteel/contracts'

/**
 * NOTIF-05 copy and the conversions between a `<input type="time">` value and
 * the minutes-from-midnight the contract stores. Pure, because the wrapping
 * window and the "this is on but cannot reach you" states are exactly the
 * things that are easy to word wrongly.
 */

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
	REST_ALERT: 'Rest alerts',
	TRAINING_REMINDER: 'Training reminders',
	STREAK_AT_RISK: 'Streak at risk',
}

export const CATEGORY_DESCRIPTIONS: Record<NotificationCategory, string> = {
	REST_ALERT:
		'When a rest period ends while Sunnsteel is closed or your screen is locked.',
	TRAINING_REMINDER:
		'Once on the days you are planned to train, at the time you choose below.',
	STREAK_AT_RISK:
		'On the last day a training run can still be continued. It replaces that day’s reminder rather than adding a second notification, and it states the dates rather than telling you to train.',
}

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
export function describeQuietHours(quietHours: QuietHours | null): string {
	if (!quietHours) return 'Notifications can arrive at any time.'
	if (quietHours.startMinute === quietHours.endMinute) {
		return 'The window is empty, so nothing is silenced.'
	}
	const start = formatMinuteOfDay(quietHours.startMinute)
	const end = formatMinuteOfDay(quietHours.endMinute)
	const overnight = quietHours.startMinute > quietHours.endMinute
	return overnight
		? `Nothing is delivered between ${start} and ${end} the next morning.`
		: `Nothing is delivered between ${start} and ${end}.`
}

export function describeReminder(minuteOfDay: number | null): string {
	return minuteOfDay === null
		? 'No reminder is sent.'
		: `Sent at ${formatMinuteOfDay(minuteOfDay)} on the days you are planned to train, and not on the days you are not.`
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

export const PREFERENCES_NOTICE_COPY: Record<
	Exclude<PreferencesNotice, null>,
	string
> = {
	PUSH_UNAVAILABLE:
		'This server cannot send notifications, so none of these choices has any effect yet.',
	NO_DEVICE:
		'No device is set up to receive notifications yet, so these choices have nothing to apply to.',
	ALL_CATEGORIES_OFF:
		'Every category is off, so this device will receive nothing.',
}

/**
 * The reminder needs a zone to know when the owner's day is. The device knows
 * it; the server only learns it when a device registers one.
 */
export function describeTimeZone(timeZone: string | null): string {
	return timeZone
		? `Times are read in ${timeZone}, registered by your device.`
		: 'Your time zone has not reached the server yet, so reminders stay off until it does.'
}
