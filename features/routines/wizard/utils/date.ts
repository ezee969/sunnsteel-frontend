import { format, parse } from 'date-fns'

const ISO_DATE_PATTERN = 'yyyy-MM-dd'
const DISPLAY_DATE_PATTERN = 'dd/MM/yyyy'

/**
 * Parse a 'yyyy-MM-dd' formatted string into a Date object.
 *
 * @param value - Optional date string in `yyyy-MM-dd` format
 * @returns The corresponding `Date` if `value` is present and valid, `undefined` otherwise
 */
export function parseWizardDate(value?: string) {
	if (!value) return undefined
	const [year, month, day] = value.split('-').map(Number)
	const date = new Date(year, month - 1, day)
	return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Format a Date as `yyyy-MM-dd`.
 *
 * @returns The date formatted as `yyyy-MM-dd` (ISO date string).
 */
export function formatWizardDate(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * Format an optional stored 'yyyy-MM-dd' date string for user display.
 *
 * @param value - The stored date string in `yyyy-MM-dd` format; may be undefined
 * @returns The date formatted as `dd/MM/yyyy`, or `—` if `value` is missing or invalid
 */
export function formatDateForDisplay(value?: string) {
	const parsed = parseWizardDate(value)
	if (!parsed) return '—'
	return format(parsed, DISPLAY_DATE_PATTERN)
}

/**
 * Determine whether a Date occurs before today using local time at midnight.
 *
 * @param date - The Date to evaluate; its time portion is considered when comparing to today's midnight.
 * @returns `true` if `date` is earlier than today (local time, midnight), `false` otherwise.
 */
export function isPastDate(date: Date) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return date < today
}

/**
 * Parse a date string in the 'yyyy-MM-dd' format into a Date object.
 *
 * @param value - The date string in 'yyyy-MM-dd' format.
 * @returns The parsed Date, or `undefined` if `value` is empty or cannot be parsed.
 */
export function parseDateInput(value: string) {
	if (!value) return undefined
	return parse(value, ISO_DATE_PATTERN, new Date())
}
